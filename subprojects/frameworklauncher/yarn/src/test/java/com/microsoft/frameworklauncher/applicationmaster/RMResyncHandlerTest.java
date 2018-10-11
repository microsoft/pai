package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class RMResyncHandlerTest {

    private RMResyncHandler rmResyncHandler;

    @Mock
    private ApplicationMaster applicationMaster;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private Configuration configuration;

    @Mock
    private LauncherConfiguration launcherConfiguration;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        when(this.launcherConfiguration.getAmRmResyncFrequency()).thenReturn(100);
        when(this.launcherConfiguration.getAmRmResyncNmExpiryBufferSec()).thenReturn(200);
        when(this.configuration.getLauncherConfig()).thenReturn(this.launcherConfiguration);
        when(this.configuration.getYarnConfig().getInt(anyString(), anyInt())).thenReturn(100);
        this.rmResyncHandler = new RMResyncHandler(this.applicationMaster, this.configuration);
    }

    @Test
    public void start() throws Exception {
        this.rmResyncHandler.start();
        verify(this.applicationMaster, Mockito.atLeastOnce()).queueResyncWithRM(2);
    }

}
