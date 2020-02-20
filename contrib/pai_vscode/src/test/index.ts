/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */

import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
    const mocha: Mocha = new Mocha({
        ui: 'tdd', 		// the TDD UI is being used in extension.test.ts (suite, test, etc.)
        useColors: true // colored output from test results
    });

    const testsRoot: string = path.resolve(__dirname, '.');
    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot}, (err, files) => {
            if (err) {
                return e(err);
            }

            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
