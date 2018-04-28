// Copyright (c) Microsoft Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.microsoft.frameworklauncher.service;

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.definition.FrameworkStateDefinition;
import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exit.ExitDiagnostics;
import com.microsoft.frameworklauncher.common.exit.ExitStatusKey;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.exts.HadoopExts;
import com.microsoft.frameworklauncher.common.log.ChangeAwareLogger;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.service.StopStatus;
import com.microsoft.frameworklauncher.common.service.SystemTaskQueue;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import com.microsoft.frameworklauncher.common.utils.RetryUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.validation.CommonValidation;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.hdfsstore.HdfsStore;
import com.microsoft.frameworklauncher.webserver.WebServer;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.io.DataOutputBuffer;
import org.apache.hadoop.security.Credentials;
import org.apache.hadoop.security.UserGroupInformation;
import org.apache.hadoop.yarn.api.ApplicationConstants;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.apache.hadoop.yarn.conf.YarnConfiguration;
import org.apache.hadoop.yarn.exceptions.YarnException;
import org.apache.log4j.Level;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Maintains the life cycle for all Frameworks submitted to this Launcher.Service.
// It is the engine to transition Status to satisfy Request eventually.
// It is designed as a micro kernel to connect all its SubServices.
// Note:
//  It ensures at most one AM running for one Framework.
public class Service extends AbstractService {
  private static final DefaultLogger LOGGER = new DefaultLogger(Service.class);
  private static final ChangeAwareLogger CHANGE_AWARE_LOGGER = new ChangeAwareLogger(Service.class);

  private YarnConfiguration yarnConf = new YarnConfiguration();
  private LauncherConfiguration conf;
  private SystemTaskQueue transitionFrameworkStateQueue;


  /**
   * REGION SubServices
   */
  private ZookeeperStore zkStore;
  private HdfsStore hdfsStore;
  private YarnClient yarnClient;
  private StatusManager statusManager;
  private RequestManager requestManager;
  private RMResyncHandler rmResyncHandler;
  private DiagnosticsRetrieveHandler diagnosticsRetrieveHandler;


  /**
   * REGION ExternalServices
   */
  private WebServer webServer;


  /**
   * REGION AbstractService
   */
  public Service() {
    super(Service.class.getName());
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    if (e instanceof NonTransientException) {
      LOGGER.logError(e,
          "NonTransientException occurred in %1$s. %1$s will be stopped.",
          serviceName);

      stop(new StopStatus(ExitStatusKey.LAUNCHER_INTERNAL_NON_TRANSIENT_ERROR.toInt(), true, null, e));
      return false;
    } else {
      LOGGER.logError(e,
          "Exception occurred in %1$s. It should be transient. Will restart %1$s inplace.",
          serviceName);

      // TODO: Only Restart Service instead of exit whole process and Restart by external system.
      stop(new StopStatus(ExitStatusKey.LAUNCHER_INTERNAL_UNKNOWN_ERROR.toInt(), false, null, e));
      return true;
    }
  }

  @Override
  protected void initialize() throws Exception {
    super.initialize();
    transitionFrameworkStateQueue = new SystemTaskQueue(this::handleException);

    // Initialize LauncherConfiguration
    conf = YamlUtils.toObject(GlobalConstants.LAUNCHER_CONFIG_FILE, LauncherConfiguration.class);
    CommonValidation.validate(conf);

    // Initialize SubServices
    yarnClient = YarnClient.createYarnClient();
    yarnClient.init(yarnConf);
    yarnClient.start();

    // Initialize Launcher Store
    zkStore = new ZookeeperStore(conf.getZkConnectString(), conf.getZkRootDir());
    hdfsStore = new HdfsStore(conf.getHdfsRootDir());

    // Initialize other components
    rmResyncHandler = new RMResyncHandler(this, conf, yarnClient);
    diagnosticsRetrieveHandler = new DiagnosticsRetrieveHandler(this, conf, yarnClient);

    // Initialize External Service
    webServer = new WebServer(conf, zkStore);

    // Log Initialized Configuration
    LOGGER.logSplittedLines(Level.INFO,
        "Initialized %s with Configuration:\n%s",
        serviceName, WebCommon.toJson(conf));
  }

  @Override
  protected void recover() throws Exception {
    super.recover();
    statusManager = new StatusManager(this, conf, zkStore);
    statusManager.start();

    // Here StatusManager recover completed
    reviseCorruptedFrameworkStates();
    recoverTransitionFrameworkStateQueue();
  }

  @Override
  protected void run() throws Exception {
    super.run();

    // Start ExternalServices
    webServer.start();
    gcLeftoverFrameworks();

    // Run RequestManager depends on WebServer and gcLeftoverFrameworks
    requestManager = new RequestManager(this, conf, zkStore);
    requestManager.start();
  }

  // THREAD SAFE
  @Override
  public synchronized void stop(StopStatus stopStatus) {
    // Best Effort to stop Gracefully
    super.stop(stopStatus);

    AggregateException ae = new AggregateException();

    // Stop Service's SubServices
    try {
      if (yarnClient != null) {
        yarnClient.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    try {
      if (zkStore != null) {
        zkStore.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    if (ae.getExceptions().size() > 0) {
      LOGGER.logWarning(ae, "Failed to stop %s gracefully", serviceName);
    }

    LOGGER.logInfo("%s stopped", serviceName);
    System.exit(stopStatus.getCode());
  }


  /**
   * REGION InternalUtils
   */
  // GC Framework level external resource [HDFS] for LeftoverFrameworks.
  // LeftoverFrameworks may be caused by HDFS down, race condition, etc.
  private void gcLeftoverFrameworks() throws Exception {
    Set<String> frameworkNamesInStatus = statusManager.getFrameworkNames();
    Set<String> frameworkNamesInHdfs = hdfsStore.getFrameworkNames();
    String logPrefix = "gcLeftoverFrameworks: ";

    LOGGER.logInfo(logPrefix +
            "Started: Frameworks in HDFS: [%s], Frameworks in Status: [%s]",
        frameworkNamesInHdfs.size(), frameworkNamesInStatus.size());

    ExecutorService taskExecutor = Executors.newFixedThreadPool(20);
    List<Callable<String>> tasks = new ArrayList<>();
    for (String frameworkNameInHdfs : frameworkNamesInHdfs) {
      if (!frameworkNamesInStatus.contains(frameworkNameInHdfs)) {
        tasks.add(() -> {
          hdfsStore.removeFrameworkRoot(frameworkNameInHdfs);
          return frameworkNameInHdfs;
        });
        if (conf.getFrameworkLeftoverGCMaxCount() != GlobalConstants.USING_UNLIMITED_VALUE &&
            tasks.size() >= conf.getFrameworkLeftoverGCMaxCount()) {
          break;
        }
      }
    }
    taskExecutor.invokeAll(tasks);

    LOGGER.logInfo(logPrefix +
            "Succeeded: Frameworks in HDFS: [%s], Frameworks in Status: [%s]",
        frameworkNamesInHdfs.size() - tasks.size(), frameworkNamesInStatus.size());
  }

  private ContainerLaunchContext setupContainerLaunchContext(
      FrameworkStatus frameworkStatus,
      FrameworkRequest frameworkRequest,
      Resource amResource) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    AMType amType = frameworkRequest.getFrameworkDescriptor().getPlatformSpecificParameters().getAmType();

    hdfsStore.makeFrameworkRootDir(frameworkName);
    HadoopUtils.invalidateLocalResourcesCache();

    switch (amType) {
      case DEFAULT:
      default: {
        if (amType != AMType.DEFAULT) {
          LOGGER.logWarning("Unsupported AM type: [%s]. Using the default AM instead.", amType);
        }
        return setupContainerLaunchContextForDefaultAM(frameworkStatus, frameworkRequest, amResource);
      }
    }
  }

  private ContainerLaunchContext setupContainerLaunchContextForDefaultAM(
      FrameworkStatus frameworkStatus,
      FrameworkRequest frameworkRequest,
      Resource amResource) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();
    UserDescriptor loggedInUser = statusManager.getLoggedInUser();

    // SetupLocalResources
    Map<String, LocalResource> localResources = new HashMap<>();
    hdfsStore.makeFrameworkRootDir(frameworkName);
    HadoopUtils.addToLocalResources(localResources, hdfsStore.uploadAMPackageFile(frameworkName));

    // SetupLocalEnvironment
    Map<String, String> localEnvs = new HashMap<>();

    // Internal class is preferred over external class
    localEnvs.put(ApplicationConstants.Environment.CLASSPATH_PREPEND_DISTCACHE.name(), "true");
    StringBuilder classpath = new StringBuilder("*");
    for (String c : yarnConf.getStrings(
        YarnConfiguration.YARN_APPLICATION_CLASSPATH,
        YarnConfiguration.DEFAULT_YARN_CROSS_PLATFORM_APPLICATION_CLASSPATH)) {
      classpath.append(ApplicationConstants.CLASS_PATH_SEPARATOR).append(c.trim());
    }
    classpath.append(ApplicationConstants.CLASS_PATH_SEPARATOR).append(ApplicationConstants.Environment.CLASSPATH.$$());
    localEnvs.put(GlobalConstants.ENV_VAR_CLASSPATH, classpath.toString());

    // Use the user for LauncherAM the same as LauncherService, since they are all Launcher executables.
    localEnvs.put(GlobalConstants.ENV_VAR_HADOOP_USER_NAME, loggedInUser.getName());

    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_NAME, frameworkName);
    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_VERSION, frameworkVersion.toString());

    localEnvs.put(GlobalConstants.ENV_VAR_ZK_CONNECT_STRING, conf.getZkConnectString());
    localEnvs.put(GlobalConstants.ENV_VAR_ZK_ROOT_DIR, conf.getZkRootDir());
    localEnvs.put(GlobalConstants.ENV_VAR_AM_VERSION, conf.getAmVersion().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC, conf.getAmRmHeartbeatIntervalSec().toString());

    // SetupEntryPoint
    Vector<CharSequence> vargs = new Vector<>(30);
    vargs.add(ApplicationConstants.Environment.JAVA_HOME.$$() + "/bin/java");
    vargs.add("-DLOG_DIRS=$LOG_DIRS");
    vargs.add("-Xmx" + amResource.getMemory() + "m");
    vargs.add(GlobalConstants.MAIN_CLASS_APPLICATION_MASTER);
    vargs.add(String.format(
        "1>%1$sstdout 2>%1$sstderr",
        ApplicationConstants.LOG_DIR_EXPANSION_VAR + File.separator));

    StringBuilder command = new StringBuilder();
    for (CharSequence str : vargs) {
      command.append(str).append(" ");
    }
    List<String> commands = new ArrayList<>();
    commands.add(command.toString());

    // SetupSecurityTokens
    ByteBuffer fsTokens = null;
    if (UserGroupInformation.isSecurityEnabled()) {
      // Note: Credentials class is marked as LimitedPrivate for HDFS and MapReduce
      Credentials credentials = new Credentials();
      String tokenRenewer = yarnConf.get(YarnConfiguration.RM_PRINCIPAL);
      FileSystem fs = FileSystem.get(yarnConf);
      if (tokenRenewer == null || tokenRenewer.length() == 0) {
        throw new IOException(
            "Can't get Master Kerberos principal for the RM to use as renewer");
      }

      // For now, only getting tokens for the default file-system.
      final org.apache.hadoop.security.token.Token<?> tokens[] =
          fs.addDelegationTokens(tokenRenewer, credentials);
      if (tokens != null) {
        for (org.apache.hadoop.security.token.Token<?> token : tokens) {
          LOGGER.logInfo("Got dt for " + fs.getUri() + "; " + token);
        }
      }
      DataOutputBuffer dob = new DataOutputBuffer();
      credentials.writeTokenStorageToStream(dob);
      fsTokens = ByteBuffer.wrap(dob.getData(), 0, dob.getLength());
    }

    return ContainerLaunchContext.newInstance(
        localResources, localEnvs, commands, null, fsTokens, null);
  }

  private void setupApplicationContext(
      FrameworkStatus frameworkStatus,
      ApplicationSubmissionContext applicationContext) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();
    String applicationId = frameworkStatus.getApplicationId();
    String logPrefix = String.format(
        "[%s][%s][%s]: setupApplicationContext: ",
        frameworkName, frameworkVersion, applicationId);

    // Ensure FrameworkStatus is unchanged.
    if (!statusManager.containsFramework(frameworkStatus)) {
      LOGGER.logWarning(logPrefix + "Framework not found in Status. Ignore it.");
      return;
    }

    FrameworkRequest frameworkRequest = requestManager.tryGetFrameworkRequest(frameworkName, frameworkVersion);
    if (frameworkRequest == null) {
      LOGGER.logWarning(logPrefix + "Framework not found in Request. Ignore it.");
      return;
    }

    PlatformSpecificParametersDescriptor platParams = frameworkRequest.getFrameworkDescriptor().getPlatformSpecificParameters();

    String applicationName = String.format(
        "[%s]_[%s]_[%s]_[%s]_[%s]",
        frameworkName, frameworkVersion,
        frameworkRequest.getLaunchClientType(),
        frameworkRequest.getLaunchClientHostName(),
        frameworkRequest.getLaunchClientUserName());

    Resource resource;
    if (platParams.getAmResource() != null) {
      resource = platParams.getAmResource().toResource();
    } else {
      resource = conf.getAmDefaultResource().toResource();
    }

    applicationContext.setApplicationName(applicationName);
    applicationContext.setApplicationType(GlobalConstants.LAUNCHER_APPLICATION_TYPE);
    applicationContext.setAMContainerSpec(setupContainerLaunchContext(frameworkStatus, frameworkRequest, resource));

    Priority priority = Priority.newInstance(conf.getAmPriority());
    applicationContext.setResource(resource);
    applicationContext.setPriority(priority);

    ResourceRequest resourceRequest = ResourceRequest.newInstance(priority, "*", resource, 1);
    if (platParams.getAmNodeLabel() != null) {
      resourceRequest.setNodeLabelExpression(platParams.getAmNodeLabel());
      applicationContext.setNodeLabelExpression(platParams.getAmNodeLabel());
    }
    applicationContext.setAMContainerResourceRequest(resourceRequest);

    if (platParams.getQueue() != null) {
      applicationContext.setQueue(platParams.getQueue());
    }

    // Always enable Work-Preserving AM Restart
    applicationContext.setKeepContainersAcrossApplicationAttempts(true);
    applicationContext.setMaxAppAttempts(conf.getAmAttemptMaxCount());
    applicationContext.setAttemptFailuresValidityInterval(conf.getAmAttemptFailuresValidityIntervalSec() * 1000);

    // Queue launchApplication to avoid race condition
    transitionFrameworkStateQueue.queueSystemTask(() -> {
      launchApplication(frameworkStatus, applicationContext);
    });
  }


  /**
   * REGION FrameworkStateMachine
   */
  // Method which will cause transitionFrameworkState
  // Note they should be called in single thread, such as from transitionFrameworkStateQueue

  // Should be called after StatusManager recover completed
  private void reviseCorruptedFrameworkStates() throws Exception {
    LOGGER.logInfo(
        "reviseCorruptedFrameworkStates: %s",
        CommonExts.toString(FrameworkStateDefinition.STATE_CORRUPTED_AFTER_RESTART_STATES));

    List<FrameworkStatus> corruptedFrameworkStatuses = statusManager.getFrameworkStatus(FrameworkStateDefinition.STATE_CORRUPTED_AFTER_RESTART_STATES);
    for (FrameworkStatus frameworkStatus : corruptedFrameworkStatuses) {
      FrameworkState frameworkState = frameworkStatus.getFrameworkState();
      String frameworkName = frameworkStatus.getFrameworkName();

      // Previous Created Application will lost the ApplicationSubmissionContext object to Launch after AM Restart
      // Because misjudge a ground truth Running Application to be FRAMEWORK_WAITING (lose Framework) is more serious than
      // misjudge a ground truth not Running Application to Running. (The misjudged Application will be completed
      // by RMResync eventually, so the only impact is longger time to run the Framework)
      if (frameworkState == FrameworkState.APPLICATION_CREATED) {
        statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_LAUNCHED);
      }
    }
  }

  private void recoverTransitionFrameworkStateQueue() {
    // No need to recover TransitionFrameworkStateQueue for:
    // 1. STATE_CORRUPTED_AFTER_RESTART_STATES, since they are revised to other States by reviseCorruptedFrameworkStates
    // 2. APPLICATION_LAUNCHED, APPLICATION_RUNNING, since they can be handled by RMResyncHandler
    // 3. FRAMEWORK_COMPLETED, since it is FinalState
    LOGGER.logInfo(
        "recoverTransitionFrameworkStateQueue for FrameworkStates: %s",
        CommonExts.toString(FrameworkStateDefinition.QUEUE_CORRUPTED_AFTER_RESTART_STATES));

    // There may be a lot of corrupted System.Frameworks, so we queue them as one System.Framework per State
    transitionFrameworkStateQueue.queueSystemTask(() -> {
      createApplication();
    });
    LOGGER.logInfo("All the previous FRAMEWORK_WAITING Frameworks have been driven");

    transitionFrameworkStateQueue.queueSystemTask(() -> {
      retrieveApplicationDiagnostics();
    });
    LOGGER.logInfo("All the previous APPLICATION_RETRIEVING_DIAGNOSTICS Frameworks have been driven");

    transitionFrameworkStateQueue.queueSystemTask(() -> {
      attemptToRetry();
    });
    LOGGER.logInfo("All the previous APPLICATION_COMPLETED Frameworks have been driven");
  }

  private void completeApplication(FrameworkStatus frameworkStatus, int exitCode, String diagnostics) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    String applicationId = frameworkStatus.getApplicationId();

    LOGGER.logSplittedLines(Level.INFO,
        "[%s][%s]: completeApplication: ExitCode: %s, ExitDiagnostics: %s",
        frameworkName, applicationId, exitCode, diagnostics);

    statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_COMPLETED,
        new FrameworkEvent().setApplicationExitCode(exitCode).setApplicationExitDiagnostics(diagnostics));
    attemptToRetry(frameworkStatus);
  }

  // retrieveApplicationDiagnostics to prepare completeApplication
  private void retrieveApplicationDiagnostics(String applicationId, Integer exitCode, String diagnostics, boolean needToKill) throws Exception {
    if (needToKill) {
      HadoopUtils.killApplication(applicationId);
    }

    String logSuffix = String.format(
        "[%s]: retrieveApplicationDiagnostics: ExitCode: %s, ExitDiagnostics: %s, NeedToKill: %s",
        applicationId, exitCode, diagnostics, needToKill);

    if (!statusManager.isApplicationIdAssociated(applicationId)) {
      LOGGER.logWarning("[NotAssociated]%s", logSuffix);
      return;
    }

    FrameworkStatus frameworkStatus = statusManager.getFrameworkStatusWithAssociatedApplicationId(applicationId);
    String frameworkName = frameworkStatus.getFrameworkName();

    // Schedule to retrieveDiagnostics
    LOGGER.logDebug("[%s]%s", frameworkName, logSuffix);
    statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS,
        new FrameworkEvent().setApplicationExitCode(exitCode).setApplicationExitDiagnostics(diagnostics));
    diagnosticsRetrieveHandler.retrieveDiagnosticsAsync(applicationId, diagnostics);
  }

  private void retrieveApplicationDiagnostics() throws Exception {
    for (FrameworkStatus frameworkStatus : statusManager.getFrameworkStatus(
        new HashSet<>(Collections.singletonList(FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS)))) {
      // No need to kill, since if a Framework is in APPLICATION_RETRIEVING_DIAGNOSTICS,
      // it is guaranteed to be already killed.
      retrieveApplicationDiagnostics(
          frameworkStatus.getApplicationId(),
          frameworkStatus.getApplicationExitCode(),
          frameworkStatus.getApplicationExitDiagnostics(),
          false);
    }
  }

  // retrieveApplicationExitCode to prepare completeApplication
  private void retrieveApplicationExitCode(String applicationId, String diagnostics) throws Exception {
    String logSuffix = String.format(
        "[%s]: retrieveApplicationExitCode: ExitDiagnostics: %s",
        applicationId, diagnostics);

    if (!statusManager.isApplicationIdAssociated(applicationId)) {
      LOGGER.logWarning("[NotAssociated]%s", logSuffix);
      return;
    }

    FrameworkStatus frameworkStatus = statusManager.getFrameworkStatusWithAssociatedApplicationId(applicationId);
    FrameworkState frameworkState = frameworkStatus.getFrameworkState();
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer exitCode = frameworkStatus.getApplicationExitCode();

    if (frameworkState != FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS) {
      LOGGER.logWarning("[%s]%s. Current FrameworkState %s is not %s. Ignore it.",
          frameworkName, logSuffix, frameworkState, FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS);
      return;
    }

    // RetrieveExitCode
    LOGGER.logDebug("[%s]%s", frameworkName, logSuffix);
    if (exitCode == null) {
      ExitStatusKey exitStatusKey = ExitDiagnostics.extractExitStatusKey(diagnostics);
      exitCode = ExitDiagnostics.lookupExitCode(exitStatusKey);
    }

    completeApplication(frameworkStatus, exitCode, diagnostics);
  }

  private void launchApplication(FrameworkStatus frameworkStatus, ApplicationSubmissionContext applicationContext) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();
    String applicationId = frameworkStatus.getApplicationId();
    String logPrefix = String.format(
        "[%s][%s][%s]: launchApplication: ",
        frameworkName, frameworkVersion, applicationId);

    // Ensure FrameworkStatus is unchanged.
    if (!statusManager.containsFramework(frameworkStatus)) {
      LOGGER.logWarning(logPrefix + "Framework not found in Status. Ignore it.");
      return;
    }

    FrameworkRequest frameworkRequest = requestManager.tryGetFrameworkRequest(frameworkName, frameworkVersion);
    if (frameworkRequest == null) {
      LOGGER.logWarning(logPrefix + "Framework not found in Request. Ignore it.");
      return;
    }
    UserDescriptor user = frameworkRequest.getFrameworkDescriptor().getUser();

    logPrefix += "SubmitApplication: ";
    try {
      LOGGER.logInfo(logPrefix + "ApplicationName: %s", applicationContext.getApplicationName());
      LOGGER.logInfo(logPrefix + "ResourceRequest: %s", HadoopExts.toString(applicationContext.getAMContainerResourceRequest()));
      LOGGER.logInfo(logPrefix + "Queue: %s", applicationContext.getQueue());

      HadoopUtils.submitApplication(applicationContext, user);

      LOGGER.logInfo(logPrefix + "Succeeded");
    } catch (Throwable e) {
      LOGGER.logWarning(e, logPrefix + "Failed");
      String eMsg = CommonUtils.toString(e);

      // YarnException indicates exceptions from yarn servers, and IOException indicates exceptions from RPC layer.
      // So, consider YarnException as NonTransientError, and IOException as TransientError.
      if (e instanceof YarnException) {
        retrieveApplicationDiagnostics(
            applicationId,
            ExitStatusKey.LAUNCHER_SUBMIT_APP_NON_TRANSIENT_ERROR.toInt(),
            "Failed to submit application due to non-transient error, maybe application is non-compliant." + eMsg,
            true);
        return;
      } else if (e instanceof IOException) {
        retrieveApplicationDiagnostics(
            applicationId,
            ExitStatusKey.LAUNCHER_SUBMIT_APP_TRANSIENT_ERROR.toInt(),
            "Failed to submit application due to transient error, maybe YARN RM is down." + eMsg,
            true);
        return;
      } else {
        retrieveApplicationDiagnostics(
            applicationId,
            ExitStatusKey.LAUNCHER_SUBMIT_APP_UNKNOWN_ERROR.toInt(),
            "Failed to submit application due to unknown error." + eMsg,
            true);
        return;
      }
    }

    statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_LAUNCHED);
  }

  private void createApplication(FrameworkStatus frameworkStatus, boolean isPlaceholderApplication) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    ApplicationSubmissionContext applicationContext = yarnClient.createApplication().getApplicationSubmissionContext();
    statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_CREATED,
        new FrameworkEvent().setApplicationContext(applicationContext).setSkipToPersist(isPlaceholderApplication));

    if (!isPlaceholderApplication) {
      // Concurrently setupApplicationContext
      FrameworkStatus frameworkStatusSnapshot = YamlUtils.deepCopy(frameworkStatus, FrameworkStatus.class);
      new Thread(() -> {
        try {
          // Always Setup a brand new ApplicationContext to tolerate ApplicationContext corruption,
          // such as HDFS data lost.
          // Retry to setupApplicationContext due to the race condition with onFrameworkToRemove.
          RetryUtils.executeWithRetry(() -> {
                setupApplicationContext(frameworkStatusSnapshot, applicationContext);
              },
              conf.getApplicationSetupContextMaxRetryCount(),
              conf.getApplicationSetupContextRetryIntervalSec(), null);
        } catch (Exception e) {
          onExceptionOccurred(e);
        }
      }).start();
    }
  }

  private void createApplication() throws Exception {
    for (FrameworkStatus frameworkStatus : statusManager.getFrameworkStatus(
        new HashSet<>(Collections.singletonList(FrameworkState.FRAMEWORK_WAITING)))) {
      createApplication(frameworkStatus, false);
    }
  }

  private void completeFramework(FrameworkStatus frameworkStatus) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();

    LOGGER.logSplittedLines(Level.INFO,
        "%s: completeFramework: FrameworkStatus:\n%s",
        frameworkName, WebCommon.toJson(frameworkStatus));

    statusManager.transitionFrameworkState(frameworkName, FrameworkState.FRAMEWORK_COMPLETED);
  }

  private void retryFramework(FrameworkStatus frameworkStatus, RetryPolicyState newRetryPolicyState) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();
    String logPrefix = String.format(
        "[%s][%s]: retryFramework: ", frameworkName, frameworkVersion);

    // Ensure FrameworkStatus is unchanged.
    if (!statusManager.containsFramework(frameworkStatus)) {
      LOGGER.logWarning(logPrefix + "Framework not found in Status. Ignore it.");
      return;
    }
    frameworkStatus = statusManager.getFrameworkStatus(frameworkName);

    LOGGER.logSplittedLines(Level.INFO,
        logPrefix + "NewRetryPolicyState:\n%s",
        WebCommon.toJson(newRetryPolicyState));

    statusManager.transitionFrameworkState(frameworkName, FrameworkState.FRAMEWORK_WAITING,
        new FrameworkEvent().setNewRetryPolicyState(newRetryPolicyState));
    createApplication(frameworkStatus, false);
  }

  // Implement FrameworkRetryPolicy
  private void attemptToRetry(FrameworkStatus frameworkStatus) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    Integer exitCode = frameworkStatus.getApplicationExitCode();
    ExitType exitType = frameworkStatus.getApplicationExitType();
    Integer retriedCount = frameworkStatus.getFrameworkRetryPolicyState().getRetriedCount();
    RetryPolicyState newRetryPolicyState = YamlUtils.deepCopy(frameworkStatus.getFrameworkRetryPolicyState(), RetryPolicyState.class);
    Integer transientConflictRetriedCount = frameworkStatus.getFrameworkRetryPolicyState().getTransientConflictRetriedCount();
    String logPrefix = String.format("[%s]: attemptToRetry: ", frameworkName);

    FrameworkRequest frameworkRequest = requestManager.tryGetFrameworkRequest(frameworkName, frameworkStatus.getFrameworkVersion());
    if (frameworkRequest == null) {
      LOGGER.logWarning(logPrefix + "Framework not found in Request. Ignore it.");
      return;
    }

    LOGGER.logSplittedLines(Level.INFO,
        logPrefix + "ApplicationExitCode: [%s], ApplicationExitType: [%s], RetryPolicyState:\n[%s]",
        exitCode, exitType, WebCommon.toJson(newRetryPolicyState));

    // 1. ApplicationSucceeded
    if (exitCode == ExitStatusKey.SUCCEEDED.toInt()) {
      LOGGER.logInfo(logPrefix +
          "Will completeFramework with FrameworkSucceeded. Reason: " +
          "ApplicationExitCode = %s.", exitCode);

      completeFramework(frameworkStatus);
      return;
    }

    // 2. ApplicationFailed
    RetryPolicyDescriptor retryPolicy = frameworkRequest.getFrameworkDescriptor().getRetryPolicy();
    String completeFrameworkLogPrefix = logPrefix + "Will completeFramework with ApplicationFailed. Reason: ";
    String retryFrameworkLogPrefix = logPrefix + "Will retryFramework with new Application. Reason: ";

    // 2.1. FancyRetryPolicy
    String fancyRetryPolicyLogSuffix = String.format("FancyRetryPolicy: %s Failure Occurred.", exitType);
    if (exitType == ExitType.NON_TRANSIENT) {
      newRetryPolicyState.setNonTransientRetriedCount(newRetryPolicyState.getNonTransientRetriedCount() + 1);
      if (retryPolicy.getFancyRetryPolicy()) {
        LOGGER.logWarning(completeFrameworkLogPrefix + fancyRetryPolicyLogSuffix);
        completeFramework(frameworkStatus);
        return;
      }
    } else if (exitType == ExitType.TRANSIENT_NORMAL) {
      newRetryPolicyState.setTransientNormalRetriedCount(newRetryPolicyState.getTransientNormalRetriedCount() + 1);
      if (retryPolicy.getFancyRetryPolicy()) {
        LOGGER.logWarning(retryFrameworkLogPrefix + fancyRetryPolicyLogSuffix);
        retryFramework(frameworkStatus, newRetryPolicyState);
        return;
      }
    } else if (exitType == ExitType.TRANSIENT_CONFLICT) {
      newRetryPolicyState.setTransientConflictRetriedCount(newRetryPolicyState.getTransientConflictRetriedCount() + 1);
      if (retryPolicy.getFancyRetryPolicy()) {
        int delaySec = RetryUtils.calcRandomBackoffDelay(
            transientConflictRetriedCount,
            conf.getApplicationTransientConflictMinDelaySec(),
            conf.getApplicationTransientConflictMaxDelaySec());

        LOGGER.logWarning(logPrefix +
            "Will retryFramework with new Application after %ss. Reason: " +
            fancyRetryPolicyLogSuffix, delaySec);

        FrameworkStatus frameworkStatusSnapshot = YamlUtils.deepCopy(frameworkStatus, FrameworkStatus.class);
        transitionFrameworkStateQueue.queueSystemTaskDelayed(() -> {
          retryFramework(frameworkStatusSnapshot, newRetryPolicyState);
        }, delaySec * 1000);
        return;
      }
    } else {
      newRetryPolicyState.setUnKnownRetriedCount(newRetryPolicyState.getUnKnownRetriedCount() + 1);
      if (retryPolicy.getFancyRetryPolicy()) {
        // FancyRetryPolicy only handle Transient and NON_TRANSIENT Failure specially,
        // Leave UNKNOWN Failure to NormalRetryPolicy
        LOGGER.logWarning(logPrefix +
            "Transfer the RetryDecision to NormalRetryPolicy. Reason: " +
            fancyRetryPolicyLogSuffix);
      }
    }

    // 2.2. NormalRetryPolicy
    if (retryPolicy.getMaxRetryCount() != GlobalConstants.USING_UNLIMITED_VALUE &&
        retriedCount >= retryPolicy.getMaxRetryCount()) {
      LOGGER.logWarning(completeFrameworkLogPrefix +
              "RetriedCount %s has reached MaxRetryCount %s.",
          retriedCount, retryPolicy.getMaxRetryCount());

      completeFramework(frameworkStatus);
      return;
    } else {
      newRetryPolicyState.setRetriedCount(newRetryPolicyState.getRetriedCount() + 1);

      LOGGER.logWarning(retryFrameworkLogPrefix +
              "RetriedCount %s has not reached MaxRetryCount %s.",
          retriedCount, retryPolicy.getMaxRetryCount());
      retryFramework(frameworkStatus, newRetryPolicyState);
      return;
    }
  }

  private void attemptToRetry() throws Exception {
    for (FrameworkStatus frameworkStatus : statusManager.getFrameworkStatus(
        new HashSet<>(Collections.singletonList(FrameworkState.APPLICATION_COMPLETED)))) {
      attemptToRetry(frameworkStatus);
    }
  }

  private void resyncFrameworksWithLiveApplications(Map<String, ApplicationReport> liveApplicationReports) throws Exception {
    // Since Application is persistent in ZK by RM, so liveApplicationReports will never incomplete.
    String logScope = "resyncFrameworksWithLiveApplications";
    CHANGE_AWARE_LOGGER.initializeScope(logScope, Level.INFO);
    CHANGE_AWARE_LOGGER.log(logScope,
        "Got %s live Applications from RM, start to resync them.",
        liveApplicationReports.size());

    for (ApplicationReport applicationReport : liveApplicationReports.values()) {
      String applicationId = applicationReport.getApplicationId().toString();
      YarnApplicationState applicationState = applicationReport.getYarnApplicationState();
      FinalApplicationStatus applicationFinalStatus = applicationReport.getFinalApplicationStatus();
      String diagnostics = applicationReport.getDiagnostics();

      if (statusManager.isApplicationIdLiveAssociated(applicationId)) {
        FrameworkStatus frameworkStatus = statusManager.getFrameworkStatusWithLiveAssociatedApplicationId(applicationId);
        String frameworkName = frameworkStatus.getFrameworkName();
        FrameworkState frameworkState = frameworkStatus.getFrameworkState();
        if (frameworkState == FrameworkState.APPLICATION_CREATED) {
          continue;
        }

        // updateApplicationStatus
        statusManager.updateApplicationStatus(frameworkName, applicationReport);

        // transitionFrameworkState
        if (applicationFinalStatus == FinalApplicationStatus.UNDEFINED) {
          if (applicationState == YarnApplicationState.NEW ||
              applicationState == YarnApplicationState.NEW_SAVING ||
              applicationState == YarnApplicationState.SUBMITTED ||
              applicationState == YarnApplicationState.ACCEPTED) {
            statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_WAITING);
          } else if (applicationState == YarnApplicationState.RUNNING) {
            statusManager.transitionFrameworkState(frameworkName, FrameworkState.APPLICATION_RUNNING);
          }
        } else if (applicationFinalStatus == FinalApplicationStatus.SUCCEEDED) {
          retrieveApplicationDiagnostics(
              applicationId,
              ExitStatusKey.SUCCEEDED.toInt(),
              diagnostics,
              false);
        } else if (applicationFinalStatus == FinalApplicationStatus.KILLED) {
          retrieveApplicationDiagnostics(
              applicationId,
              ExitStatusKey.AM_KILLED_BY_USER.toInt(),
              diagnostics,
              false);
        } else if (applicationFinalStatus == FinalApplicationStatus.FAILED) {
          retrieveApplicationDiagnostics(
              applicationId,
              null,
              diagnostics,
              false);
        }
      } else {
        // Do not kill Application due to AM_RM_RESYNC_EXCEED, since Exceed AM will kill itself.
        // In this way, we can support multiple LauncherServices to share a single RM,
        // like the sharing of HDFS and ZK.
      }
    }

    List<String> liveAssociatedApplicationIds = statusManager.getLiveAssociatedApplicationIds();
    for (String applicationId : liveAssociatedApplicationIds) {
      if (!liveApplicationReports.containsKey(applicationId)) {
        FrameworkStatus frameworkStatus = statusManager.getFrameworkStatusWithLiveAssociatedApplicationId(applicationId);
        String frameworkName = frameworkStatus.getFrameworkName();
        FrameworkState frameworkState = frameworkStatus.getFrameworkState();

        // APPLICATION_CREATED Application is not in the liveApplicationReports, but it is indeed live in RM.
        if (frameworkState == FrameworkState.APPLICATION_CREATED) {
          continue;
        }

        LOGGER.logWarning(
            "[%s]: Cannot find live associated Application %s in resynced live Applications. " +
                "Will complete it with RMResyncLost ExitStatus",
            frameworkName, applicationId);

        retrieveApplicationDiagnostics(
            applicationId,
            ExitStatusKey.AM_RM_RESYNC_LOST.toInt(),
            "AM lost after RMResynced",
            false);
      }
    }
  }


  /**
   * REGION Callbacks
   */
  // Service integrate and process all Callbacks from all its SubServices
  // Note, if a Callback may change FrameworkState/FrameworkStatus, it should be queued in transitionFrameworkStateQueue
  // to let Callee(TaskQueue) to handle it in order.
  // Note:
  //  1. Queued SystemTask need to double check whether the input param still valid at the time being Executed.
  //  2. For Status: Do not queue SystemTask with Status as the input param otherwise need to double check its
  //  validity inside the SystemTask.
  //  3. For Request: Always need to double check the corresponding Request's validity inside the SystemTask,
  //  since RequestManager is not synchronized.
  // For Service:
  //  1. For Status: Queued Status is double checked.
  //  2. For Request: Request is double checked, except for onFrameworkRequestsUpdated since we need a Request snapshot anyway.

  // Callbacks from SubServices
  public void onExceptionOccurred(Exception e) {
    LOGGER.logInfo(e, "onExceptionOccurred");

    // Handle SubService Exception ASAP
    handleException(e);
  }

  // Callbacks from StatusManager and RequestManager
  // FrameworkName -> FrameworkRequest
  // Service may need to double check whether FrameworkRequests is changed or not according to StatusManager
  public void onFrameworkRequestsUpdated(Map<String, FrameworkRequest> frameworkRequests) {
    LOGGER.logInfo("onFrameworkRequestsUpdated: FrameworkRequests: [%s]", frameworkRequests.size());
    transitionFrameworkStateQueue.queueSystemTask(() -> {
      statusManager.updateFrameworkRequests(frameworkRequests);
      createApplication();
    });
  }

  // Cleanup Framework level external resource [HDFS, RM] before RemoveFramework.
  // onFrameworkToRemove is already in queue, so queue it again will disorder
  // the result of onFrameworkRequestsUpdated and other SystemTasks.
  public void onFrameworkToRemove(FrameworkStatus frameworkStatus, boolean usedToUpgrade) throws Exception {
    String frameworkName = frameworkStatus.getFrameworkName();
    String applicationId = frameworkStatus.getApplicationId();
    FrameworkState frameworkState = frameworkStatus.getFrameworkState();

    if (FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(frameworkState)) {
      // No need to completeApplication, since it is to be Removed afterwards
      HadoopUtils.killApplication(applicationId);
    }

    if (!usedToUpgrade) {
      try {
        // Although remove Framework in HDFS is slow, it is still synchronized in queue to ensure that the
        // remove operation will not remove the Framework which is not to be removed.
        // Note that for the same Framework, there is race condition between the remove operation and
        // setupContainerLaunchContext, but the race condition is safe:
        // If the remove operation before or during the setupContainerLaunchContext,
        // the Framework is LeftoverFramework and it will be Cleanuped by gcLeftoverFrameworks.
        // Otherwise, the Framework is removed totally and not need gcLeftoverFrameworks.
        hdfsStore.removeFrameworkRoot(frameworkName);
      } catch (Exception e) {
        // Best Effort to removeFrameworkRoot
        LOGGER.logWarning(e,
            "[%s]: onFrameworkToRemove: Failed to remove Framework in HDFS, will remove it later",
            frameworkName);
      }
    }
  }

  // Prepare and kill the associated Application of the Framework before StopFramework.
  // onFrameworkToStop is already in queue, so queue it again will disorder
  // the result of onFrameworkRequestsUpdated and other SystemTasks.
  public void onFrameworkToStop(FrameworkStatus frameworkStatus) throws Exception {
    String applicationId = frameworkStatus.getApplicationId();
    FrameworkState frameworkState = frameworkStatus.getFrameworkState();

    if (!FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(frameworkState)) {
      // Ensure a stopped Framework is always associated with an Application, so that the
      // Application's exit status can always reflect the Framework's exit status.
      createApplication(frameworkStatus, true);
    }

    if (FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(frameworkState)) {
      // No need to completeApplication, since it is to be Stopped afterwards
      HadoopUtils.killApplication(applicationId);
    }
  }

  public void onStartRMResyncHandler() {
    LOGGER.logInfo("onStartRMResyncHandler");

    rmResyncHandler.start();

    LOGGER.logInfo("All the previous APPLICATION_LAUNCHED and APPLICATION_RUNNING Frameworks have been driven");
  }

  public void onStartTransitionFrameworkStateQueue() {
    LOGGER.logInfo("onStartTransitionFrameworkStateQueue");
    transitionFrameworkStateQueue.start();
    LOGGER.logInfo("Running TransitionFrameworkStateQueue");
  }


  // Callbacks from RMResyncHandler
  public void queueResyncWithRM(int delaySec) {
    transitionFrameworkStateQueue.queueSystemTaskDelayed(() -> {
      rmResyncHandler.resyncWithRM();
    }, delaySec * 1000);
  }

  // ApplicationId -> ApplicationReport
  public void onLiveApplicationsUpdated(Map<String, ApplicationReport> liveApplicationReports) throws Exception {
    LOGGER.logDebug("onLiveApplicationsUpdated: LiveApplications: [%s]", liveApplicationReports.size());

    // onLiveApplicationsUpdated is already in queue, so queue it again will disorder
    // the result of resyncWithRM and other SystemTasks
    resyncFrameworksWithLiveApplications(liveApplicationReports);
  }


  // Callbacks from DiagnosticsRetrieveHandler
  public void onDiagnosticsRetrieved(String applicationId, String diagnostics) {
    if (ExitDiagnostics.isDiagnosticsEmpty(diagnostics)) {
      // Can ensure diagnostics is not Empty
      diagnostics = ExitDiagnostics.generateDiagnostics(
          ExitStatusKey.LAUNCHER_DIAGNOSTICS_UNRETRIEVABLE);
    }

    String finalDiagnostics = diagnostics;
    transitionFrameworkStateQueue.queueSystemTask(() -> {
      retrieveApplicationExitCode(applicationId, finalDiagnostics);
    });
  }
}
