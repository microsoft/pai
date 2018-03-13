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

package com.microsoft.frameworklauncher.webserver;

import com.google.inject.Inject;
import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.exceptions.AuthorizationException;
import com.microsoft.frameworklauncher.common.exceptions.BadRequestException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.validation.CommonValidation;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.common.web.WebStructure;
import org.apache.http.HttpStatus;
import org.apache.log4j.Level;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Path("/")
public class LauncherModule {
  private static final DefaultLogger LOGGER = new DefaultLogger(LauncherModule.class);
  private final LauncherConfiguration conf;
  private final StatusManager statusManager;
  private final RequestManager requestManager;

  @Inject
  public LauncherModule(LauncherConfiguration conf, StatusManager statusManager, RequestManager requestManager) {
    this.conf = conf;
    this.statusManager = statusManager;
    this.requestManager = requestManager;
  }

  private static LaunchClientType getLaunchClientType(
      CommonExts.NoExceptionCallable<String> ResolveLaunchClientTypeStr) throws BadRequestException {
    String launchClientTypeStr = ResolveLaunchClientTypeStr.call();
    if (launchClientTypeStr == null) {
      return null;
    }

    try {
      return LaunchClientType.valueOf(launchClientTypeStr);
    } catch (Exception e) {
      throw new BadRequestException(String.format(
          "Failed to ParseLaunchClientTypeStr: [%s]",
          launchClientTypeStr), e);
    }
  }

  private static String getName(
      CommonExts.NoExceptionCallable<String> ResolveName) throws BadRequestException {
    String name = ResolveName.call();
    if (name == null) {
      return null;
    }

    CommonValidation.validate(name);
    return name;
  }

  private static Boolean getBoolean(
      CommonExts.NoExceptionCallable<String> ResolveBoolean) throws BadRequestException {
    String booleanStr = ResolveBoolean.call();
    if (booleanStr == null) {
      return null;
    }

    if (!booleanStr.equalsIgnoreCase("true") && !booleanStr.equalsIgnoreCase("false")) {
      throw new BadRequestException(String.format(
          "Failed to ParseBooleanStr: [%s]", booleanStr));
    }

    return Boolean.valueOf(booleanStr);
  }

  private void checkWritableAccess(
      HttpServletRequest hsr) throws Exception {
    checkWritableAccess(hsr, null, null);
  }

  private void checkWritableAccess(
      HttpServletRequest hsr, String frameworkName) throws Exception {
    checkWritableAccess(hsr, frameworkName, null);
  }

  private void checkWritableAccess(
      HttpServletRequest hsr, String frameworkName, UserDescriptor frameworkUser) throws Exception {
    if (!conf.getWebServerAclEnable()) {
      return;
    }

    AclConfiguration aclConf = requestManager.getLauncherRequest().getAclConfiguration();
    UserDescriptor user = UserDescriptor.newInstance(
        getName(() -> hsr.getHeader(WebCommon.REQUEST_HEADER_USER_NAME)));

    if (frameworkName == null) {
      checkNonFrameworkWritableAccess(user, aclConf);
    } else {
      validateFrameworkUserConsistency(user, frameworkUser);
      String namespace = CommonValidation.validateAndGetNamespace(frameworkName);
      checkFrameworkWritableAccess(user, namespace, aclConf);
    }
  }

  private void checkNonFrameworkWritableAccess(
      UserDescriptor user, AclConfiguration aclConf) throws Exception {
    if (!getAdminUsers(aclConf).contains(user)) {
      throw new AuthorizationException(
          "This operation needs administrator privilege.");
    }
  }

  private void validateFrameworkUserConsistency(
      UserDescriptor user, UserDescriptor frameworkUser) throws Exception {
    if (frameworkUser != null && !frameworkUser.equals(user)) {
      throw new BadRequestException(String.format(
          "The UserName specified in the FrameworkDescriptor [%s] is " +
              "not the same as the one specified in the HttpRequestHeader [%s].",
          frameworkUser, user));
    }
  }

  private void checkFrameworkWritableAccess(
      UserDescriptor user, String namespace, AclConfiguration aclConf) throws Exception {
    if (!getEffectiveNamespaceAcl(namespace, aclConf).containsUser(user)) {
      throw new AuthorizationException(String.format(
          "User [%s] does not have the Writable Access to the Namespace [%s].",
          user, namespace));
    }
  }

  private AccessControlList getEffectiveNamespaceAcl(
      String namespace, AclConfiguration aclConf) throws Exception {
    AccessControlList namespaceAcl = new AccessControlList();

    // 1. Add Predefined Acl
    // 1.1 Admin Users can always write the Namespace
    namespaceAcl.addUsers(getAdminUsers(aclConf));
    // 1.2 User can always write the Namespace whose name is the same as User
    namespaceAcl.addUser(UserDescriptor.newInstance(namespace));

    // 2. Add Configured Acl
    namespaceAcl.addUsers(aclConf.getNamespaceAcls().
        getOrDefault(namespace, new AccessControlList()).getUsers());

    return namespaceAcl;
  }

  private Set<UserDescriptor> getAdminUsers(
      AclConfiguration aclConf) throws Exception {
    Set<UserDescriptor> adminUsers = new HashSet<>();
    adminUsers.add(statusManager.getLauncherStatus().getLoggedInUser());
    adminUsers.addAll(conf.getRootAdminUsers());
    adminUsers.addAll(aclConf.getNormalAdminUsers());
    return adminUsers;
  }

  @GET
  @Path(WebStructure.ROOT_PATH)
  @Produces({MediaType.TEXT_PLAIN})
  public String getRootActiveMessage() {
    return "Active at " + GlobalConstants.LOCAL_HOST_NAME;
  }

  @GET
  @Path(WebStructure.VERSION_PATH)
  @Produces({MediaType.TEXT_PLAIN})
  public String getVersionActiveMessage() {
    return getRootActiveMessage();
  }

  @GET
  @Path(WebStructure.LAUNCHER_STATUS_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public LauncherStatus getLauncherStatus() {
    return statusManager.getLauncherStatus();
  }

  @GET
  @Path(WebStructure.LAUNCHER_REQUEST_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public LauncherRequest getLauncherRequest() throws Exception {
    return requestManager.getLauncherRequest();
  }

  @PUT
  @Path(WebStructure.DATA_DEPLOYMENT_VERSION_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putDataDeploymentVersion(
      @Context HttpServletRequest hsr,
      UpdateDataDeploymentVersionRequest updateDataDeploymentVersionRequest) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "putDataDeploymentVersion: \n%s",
        WebCommon.toJson(updateDataDeploymentVersionRequest));

    CommonValidation.validate(updateDataDeploymentVersionRequest);
    checkWritableAccess(hsr);

    requestManager.updateDataDeploymentVersion(updateDataDeploymentVersionRequest);
    return Response
        .status(HttpStatus.SC_OK)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @PUT
  @Path(WebStructure.CLUSTER_CONFIGURATION_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putClusterConfiguration(
      @Context HttpServletRequest hsr,
      ClusterConfiguration clusterConfiguration) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "putClusterConfiguration: \n%s",
        WebCommon.toJson(clusterConfiguration));

    CommonValidation.validate(clusterConfiguration);
    checkWritableAccess(hsr);

    requestManager.updateClusterConfiguration(clusterConfiguration);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @GET
  @Path(WebStructure.CLUSTER_CONFIGURATION_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public ClusterConfiguration getClusterConfiguration(
      @Context HttpServletRequest hsr) throws Exception {
    return requestManager.getClusterConfiguration();
  }

  @PUT
  @Path(WebStructure.ACL_CONFIGURATION_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putAclConfiguration(
      @Context HttpServletRequest hsr,
      AclConfiguration aclConfiguration) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "putAclConfiguration: \n%s",
        WebCommon.toJson(aclConfiguration));

    CommonValidation.validate(aclConfiguration);
    checkWritableAccess(hsr);

    requestManager.updateAclConfiguration(aclConfiguration);
    return Response
        .status(HttpStatus.SC_OK)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @GET
  @Path(WebStructure.ACL_CONFIGURATION_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public AclConfiguration getAclConfiguration(
      @Context HttpServletRequest hsr) throws Exception {
    return requestManager.getAclConfiguration();
  }

  @GET
  @Path(WebStructure.FRAMEWORK_ROOT_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public SummarizedFrameworkInfos getFrameworks(@Context HttpServletRequest hsr) throws Exception {
    LaunchClientType clientType = getLaunchClientType(() ->
        hsr.getParameter(WebStructure.REQUEST_PARAM_LAUNCH_CLIENT_TYPE));
    String userName = getName(() ->
        hsr.getParameter(WebStructure.REQUEST_PARAM_USER_NAME));

    List<FrameworkRequest> frameworkRequests =
        requestManager.getFrameworkRequests(clientType, userName);

    List<SummarizedFrameworkInfo> sFrameworkInfoList = new ArrayList<>();
    for (FrameworkRequest frameworkRequest : frameworkRequests) {
      FrameworkStatus frameworkStatus = statusManager.getFrameworkStatus(frameworkRequest);
      sFrameworkInfoList.add(SummarizedFrameworkInfo.newInstance(frameworkRequest, frameworkStatus));
    }

    SummarizedFrameworkInfos sFrameworkInfos = new SummarizedFrameworkInfos();
    sFrameworkInfos.setSummarizedFrameworkInfos(sFrameworkInfoList);
    return sFrameworkInfos;
  }

  @PUT
  @Path(WebStructure.FRAMEWORK_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putFramework(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      FrameworkDescriptor frameworkDescriptor) throws Exception {
    String logPrefix = String.format("[%s]: putFramework: ", frameworkName);

    LOGGER.logSplittedLines(Level.INFO, logPrefix + "\n%s", WebCommon.toJson(frameworkDescriptor));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(frameworkDescriptor);
    checkWritableAccess(hsr, frameworkName, frameworkDescriptor.getUser());

    // Get LaunchClientType
    LaunchClientType clientType = getLaunchClientType(() ->
        hsr.getHeader(WebCommon.REQUEST_HEADER_LAUNCH_CLIENT_TYPE));
    if (clientType == null) {
      clientType = LaunchClientType.UNKNOWN;
      LOGGER.logDebug(logPrefix +
              "Failed to Get LaunchClientType, using its default value: [%s]",
          clientType);
    }

    // Get LaunchClientHostName
    String clientHostName = hsr.getRemoteHost();
    if (clientHostName == null) {
      clientHostName = "UNKNOWN";
      LOGGER.logDebug(logPrefix +
              "Failed to Get LaunchClientHostName, using its default value: [%s]",
          clientHostName);
    }

    // Get LaunchClientUserName
    String clientUserName = hsr.getRemoteUser();
    if (clientUserName == null) {
      clientUserName = "UNKNOWN";
      LOGGER.logDebug(logPrefix +
              "Failed to Get LaunchClientUserName, using its default value: [%s]",
          clientUserName);
    }

    // Request
    FrameworkRequest frameworkRequest = new FrameworkRequest();
    frameworkRequest.setFrameworkName(frameworkName);
    frameworkRequest.setFrameworkDescriptor(frameworkDescriptor);
    frameworkRequest.setLaunchClientType(clientType);
    frameworkRequest.setLaunchClientHostName(clientHostName);
    frameworkRequest.setLaunchClientUserName(clientUserName);

    requestManager.setFrameworkRequest(frameworkRequest.getFrameworkName(), frameworkRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @PUT
  @Path(WebStructure.TASK_NUMBER_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putTaskNumber(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      @PathParam(WebStructure.TASK_ROLE_NAME_PATH_PARAM) String taskRoleName,
      UpdateTaskNumberRequest updateTaskNumberRequest) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "[%s][%s]: putTaskNumber: \n%s",
        frameworkName, taskRoleName, WebCommon.toJson(updateTaskNumberRequest));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(taskRoleName);
    CommonValidation.validate(updateTaskNumberRequest);
    checkWritableAccess(hsr, frameworkName);

    requestManager.updateTaskNumber(frameworkName, taskRoleName, updateTaskNumberRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @PUT
  @Path(WebStructure.EXECUTION_TYPE_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putExecutionType(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      UpdateExecutionTypeRequest updateExecutionTypeRequest) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "[%s]: putExecutionType: \n%s",
        frameworkName, WebCommon.toJson(updateExecutionTypeRequest));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(updateExecutionTypeRequest);
    checkWritableAccess(hsr, frameworkName);

    requestManager.updateExecutionType(frameworkName, updateExecutionTypeRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @PUT
  @Path(WebStructure.MIGRATE_TASK_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putMigrateTask(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      @PathParam(WebStructure.CONTAINER_ID_PATH_PARAM) String containerId,
      MigrateTaskRequest migrateTaskRequest) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "[%s][%s]: putMigrateTask: \n%s",
        frameworkName, containerId, WebCommon.toJson(migrateTaskRequest));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(migrateTaskRequest);
    checkWritableAccess(hsr, frameworkName);

    requestManager.updateMigrateTask(frameworkName, containerId, migrateTaskRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @PUT
  @Path(WebStructure.APPLICATION_PROGRESS_PATH)
  @Consumes({MediaType.APPLICATION_JSON})
  public Response putApplicationProgress(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      OverrideApplicationProgressRequest overrideApplicationProgressRequest) throws Exception {
    LOGGER.logSplittedLines(Level.INFO,
        "[%s]: putApplicationProgress: \n%s",
        frameworkName, WebCommon.toJson(overrideApplicationProgressRequest));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(overrideApplicationProgressRequest);
    checkWritableAccess(hsr, frameworkName);

    requestManager.updateApplicationProgress(frameworkName, overrideApplicationProgressRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @DELETE
  @Path(WebStructure.FRAMEWORK_PATH)
  public Response deleteFramework(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName) throws Exception {
    LOGGER.logInfo("[%s]: deleteFramework: Started", frameworkName);

    CommonValidation.validate(frameworkName);
    checkWritableAccess(hsr, frameworkName);

    requestManager.deleteFrameworkRequest(frameworkName);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .build();
  }

  @DELETE
  @Path(WebStructure.MIGRATE_TASK_PATH)
  public Response deleteMigrateTask(
      @Context HttpServletRequest hsr,
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      @PathParam(WebStructure.CONTAINER_ID_PATH_PARAM) String containerId) throws Exception {
    LOGGER.logInfo("[%s][%s]: deleteMigrateTask: Started", frameworkName, containerId);

    CommonValidation.validate(frameworkName);
    checkWritableAccess(hsr, frameworkName);

    requestManager.deleteMigrateTaskRequest(frameworkName, containerId);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .build();
  }

  @GET
  @Path(WebStructure.FRAMEWORK_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public FrameworkInfo getFramework(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName)
      throws Exception {
    AggregatedFrameworkRequest aggFrameworkRequest =
        requestManager.getAggregatedFrameworkRequest(frameworkName);
    FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();
    AggregatedFrameworkStatus aggFrameworkStatus =
        statusManager.getAggregatedFrameworkStatus(frameworkRequest);
    FrameworkStatus frameworkStatus = aggFrameworkStatus.getFrameworkStatus();

    FrameworkInfo frameworkInfo = new FrameworkInfo();
    frameworkInfo.setSummarizedFrameworkInfo(
        SummarizedFrameworkInfo.newInstance(frameworkRequest, frameworkStatus));
    frameworkInfo.setAggregatedFrameworkRequest(aggFrameworkRequest);
    frameworkInfo.setAggregatedFrameworkStatus(aggFrameworkStatus);

    return frameworkInfo;
  }

  @GET
  @Path(WebStructure.AGGREGATED_FRAMEWORK_STATUS_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public AggregatedFrameworkStatus getAggregatedFrameworkStatus(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName)
      throws Exception {
    FrameworkRequest frameworkRequest =
        requestManager.getFrameworkRequest(frameworkName);
    return statusManager.getAggregatedFrameworkStatus(frameworkRequest);
  }

  @GET
  @Path(WebStructure.FRAMEWORK_STATUS_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public FrameworkStatus getFrameworkStatus(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName)
      throws Exception {
    FrameworkRequest frameworkRequest =
        requestManager.getFrameworkRequest(frameworkName);
    return statusManager.getFrameworkStatus(frameworkRequest);
  }

  @GET
  @Path(WebStructure.AGGREGATED_FRAMEWORK_REQUEST_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public AggregatedFrameworkRequest getAggregatedFrameworkRequest(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName)
      throws Exception {
    return requestManager.getAggregatedFrameworkRequest(frameworkName);
  }

  @GET
  @Path(WebStructure.FRAMEWORK_REQUEST_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public FrameworkRequest getFrameworkRequest(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName)
      throws Exception {
    return requestManager.getFrameworkRequest(frameworkName);
  }
}