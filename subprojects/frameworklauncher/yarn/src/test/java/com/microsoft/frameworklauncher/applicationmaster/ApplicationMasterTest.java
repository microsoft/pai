package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.contrib.java.lang.system.ExpectedSystemExit;


public class ApplicationMasterTest {

    @Rule
    public final ExpectedSystemExit exit = ExpectedSystemExit.none();

    /**
     * The {@link ApplicationMaster} under test.
     */
    private ApplicationMaster applicationMaster;

    @Before
    public void setUp() {
        this.applicationMaster = new ApplicationMaster();
    }

    @Test
    public void handleNonTransientException() {
        this.exit.expectSystemExit();
        this.applicationMaster.handleException(new NonTransientException());
    }

    @Test
    public void handleOtherException() {
        this.exit.expectSystemExit();
        this.applicationMaster.handleException(new Exception());
    }

}
