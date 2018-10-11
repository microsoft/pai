package com.microsoft.frameworklauncher.applicationmaster;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Maps;
import com.microsoft.frameworklauncher.common.model.LauncherStatus;
import com.microsoft.frameworklauncher.common.model.UserDescriptor;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.protocolrecords.RegisterApplicationMasterResponse;
import org.apache.hadoop.yarn.api.records.QueueInfo;
import org.apache.hadoop.yarn.api.records.Resource;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.contrib.java.lang.system.EnvironmentVariables;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Map;
import java.util.Objects;

import static com.microsoft.frameworklauncher.common.GlobalConstants.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests of the {@link Configuration} class.
 */
public class ConfigurationTest {
    private static final String LOGGED_IN_USER_NAME = "test_user_name";
    private static final String AM_QUEUE = "am_queue";
    private static final Integer CPU_CORES = 11;
    private static final Integer MEMORY = 13;
    private static final String DEFAULT_NODE_LABEL_EXPRESSION = "default_node_label_expression";

    /**
     * The {@link Map} of all required environment variable name-value pairs.
     */
    private static final Map<String, String> REQUIRED_ENV_VAR_MAP = ImmutableMap.<String, String>builder()
        .put(ENV_VAR_USER, LOGGED_IN_USER_NAME)
        .put(ENV_VAR_FRAMEWORK_NAME, "test_framework_name")
        .put(ENV_VAR_FRAMEWORK_VERSION, "0")
        .put(ENV_VAR_ZK_CONNECT_STRING, "test_zk_connect_string")
        .put(ENV_VAR_ZK_ROOT_DIR, "test_zk_root_dir")
        .put(ENV_VAR_AM_VERSION, "0")
        .put(ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC, "0")
        .put(ENV_VAR_LOCAL_DIRS, "test_dirs")
        .put(ENV_VAR_LOG_DIRS, "test_log_dirs")
        .put(ENV_VAR_CONTAINER_ID, "container_1465095377475_0007_02_000001")
        .build();

    @Rule
    public final EnvironmentVariables environmentVariables = new EnvironmentVariables();

    @Mock
    private ZookeeperStore zookeeperStore;

    @Mock
    private RegisterApplicationMasterResponse response;

    @Mock
    private Resource resource;

    @Mock
    private YarnClient yarnClient;

    @Mock
    private QueueInfo queueInfo;

    /**
     * The {@link Configuration} under test.
     */
    private Configuration configuration;

    @Before
    public void setUp() {
        this.configuration = new Configuration();
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void initializeNoDependenceConfigMissingFrameworkName() {
        this.testMissingEnv(ENV_VAR_FRAMEWORK_NAME);
    }

    @Test
    public void initializeNoDependenceConfigMissingZkConnectString() {
        this.testMissingEnv(ENV_VAR_ZK_CONNECT_STRING);
    }

    @Test
    public void initializeNoDependenceConfigMissingZkRootDir() {
        this.testMissingEnv(ENV_VAR_ZK_ROOT_DIR);
    }

    @Test
    public void initializeNoDependenceConfigMissingAmVersion() {
        this.testMissingEnv(ENV_VAR_AM_VERSION);
    }

    @Test
    public void initializeNoDependenceConfigMissingAmRmHeartbeatIntervalSec() {
        this.testMissingEnv(ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC);
    }

    @Test
    public void initializeNoDependenceConfigMissingLocalDirs() {
        this.testMissingEnv(ENV_VAR_LOCAL_DIRS);
    }

    @Test
    public void initializeNoDependenceConfigMissingLogDirs() {
        this.testMissingEnv(ENV_VAR_LOG_DIRS);
    }

    @Test
    public void initializeNoDependenceConfigMissingContainerId() {
        this.testMissingEnv(ENV_VAR_CONTAINER_ID);
    }

    @Test
    public void initializeDependOnZKStoreConfig() throws Exception {
        REQUIRED_ENV_VAR_MAP.forEach(this.environmentVariables::set);
        this.configuration.initializeNoDependenceConfig();
        final LauncherStatus launcherStatus = new LauncherStatus();
        final UserDescriptor loggedInUserDescriptor = new UserDescriptor();
        loggedInUserDescriptor.setName(LOGGED_IN_USER_NAME);
        launcherStatus.setLoggedInUser(loggedInUserDescriptor);
        when(this.zookeeperStore.getLauncherStatus()).thenReturn(launcherStatus);
        this.configuration.initializeDependOnZKStoreConfig(this.zookeeperStore);
        assertThat(this.configuration.getLauncherConfig()).isEqualTo(launcherStatus.getLauncherConfiguration());
        assertThat(this.configuration.getLoggedInUser().getName()).isEqualTo(LOGGED_IN_USER_NAME);
    }

    @Test
    public void initializeDependOnRMResponseConfig() throws Exception {
        when(this.response.getMaximumResourceCapability()).thenReturn(this.resource);
        when(this.resource.getVirtualCores()).thenReturn(CPU_CORES);
        when(this.resource.getMemory()).thenReturn(MEMORY);
        when(this.response.getQueue()).thenReturn(AM_QUEUE);
        this.configuration.initializeDependOnRMResponseConfig(this.response);
        assertThat(this.configuration.getAmQueue()).isEqualTo(AM_QUEUE);
        assertThat(this.configuration.getMaxResource().getCpuNumber()).isEqualTo(CPU_CORES);
        assertThat(this.configuration.getMaxResource().getMemoryMB()).isEqualTo(MEMORY);
    }

    @Test
    public void initializeDependOnYarnClientConfig() throws Exception {
        when(this.queueInfo.getDefaultNodeLabelExpression()).thenReturn(DEFAULT_NODE_LABEL_EXPRESSION);
        when(this.yarnClient.getQueueInfo(anyString())).thenReturn(this.queueInfo);
        this.configuration.initializeDependOnYarnClientConfig(this.yarnClient);
    }

    /**
     * Tests the case when the given environment variable is not set.
     * @param missingEnv the one required environment variable that is not set.
     */
    private void testMissingEnv(final String missingEnv) {
        allEnvVarsExcept(missingEnv).forEach(this.environmentVariables::set);
        this.environmentVariables.set(missingEnv, null);
        assertThatThrownBy(() -> this.configuration.initializeNoDependenceConfig())
            .isInstanceOf(Exception.class)
            .hasMessage(
                String.format("Failed to find environment variable %s. And no default value given.", missingEnv)
            );
    }

    /**
     * @param missingEnv the environment variable to exclude when assembling the environment variable {@link Map}
     * @return a {@link Map} of all environment variables, except the given environment variable.
     */
    private static Map<String, String> allEnvVarsExcept(final String missingEnv) {
        return Maps.filterKeys(REQUIRED_ENV_VAR_MAP, k -> !Objects.equals(k, missingEnv));
    }

}