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
import java.util.List;

@Path("/")
public class LauncherModule {
  private static final DefaultLogger LOGGER = new DefaultLogger(LauncherModule.class);
  private final StatusManager statusManager;
  private final RequestManager requestManager;

  @Inject
  public LauncherModule(LauncherConfiguration conf, StatusManager statusManager, RequestManager requestManager) {
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

  private static String getUserName(
      CommonExts.NoExceptionCallable<String> ResolveUserName) throws BadRequestException {
    String userName = ResolveUserName.call();
    if (userName == null) {
      return null;
    }

    CommonValidation.validate(userName);
    return userName;
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

  @GET
  @Path(WebStructure.FRAMEWORK_ROOT_PATH)
  @Produces({MediaType.APPLICATION_JSON})
  public SummarizedFrameworkInfos getFrameworks(@Context HttpServletRequest hsr) throws Exception {
    LaunchClientType clientType = getLaunchClientType(() ->
        hsr.getParameter(WebStructure.REQUEST_PARAM_LAUNCH_CLIENT_TYPE));
    String userName = getUserName(() ->
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
    String logPrefix = String.format("[%s]: PutFrameworkFromJson: ", frameworkName);

    LOGGER.logSplittedLines(Level.INFO, logPrefix + "\n%s", WebCommon.toJson(frameworkDescriptor));

    CommonValidation.validate(frameworkName);
    CommonValidation.validate(frameworkDescriptor);

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

    requestManager.updateTaskNumber(frameworkName, taskRoleName, updateTaskNumberRequest);
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

    requestManager.updateApplicationProgress(frameworkName, overrideApplicationProgressRequest);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .header("Location", hsr.getRequestURL())
        .build();
  }

  @DELETE
  @Path(WebStructure.FRAMEWORK_PATH)
  public Response deleteFramework(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName) throws Exception {
    LOGGER.logInfo("[%s]: deleteFramework: Started", frameworkName);

    requestManager.deleteFrameworkRequest(frameworkName);
    return Response
        .status(HttpStatus.SC_ACCEPTED)
        .build();
  }

  @DELETE
  @Path(WebStructure.MIGRATE_TASK_PATH)
  public Response deleteMigrateTask(
      @PathParam(WebStructure.FRAMEWORK_NAME_PATH_PARAM) String frameworkName,
      @PathParam(WebStructure.CONTAINER_ID_PATH_PARAM) String containerId) throws Exception {
    LOGGER.logInfo("[%s][%s]: deleteMigrateTask: Started", frameworkName, containerId);

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