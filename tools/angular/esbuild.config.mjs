/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NodeJSFileSystem, ConsoleLogger, LogLevel} from '@angular/compiler-cli';
import {createEs2015LinkerPlugin} from '@angular/compiler-cli/linker/babel';
import babel from '@babel/core';
import fs from 'fs';

const linkerBabelPlugin = createEs2015LinkerPlugin({
  fileSystem: new NodeJSFileSystem(),
  logger: new ConsoleLogger(LogLevel.warn),
  // We enable JIT mode as unit tests also will rely on the linked ESM files.
  linkerJitMode: true,
});

const linkerEsbuildPlugin = {
  name: 'ng-linker-esbuild',
  setup: (build) => {
    build.onLoad({filter: /fesm2020/}, async (args) => {
      const filePath = args.path;
      const content = await fs.promises.readFile(filePath, 'utf8');
      const {code} = await babel.transformAsync(content,  {
        filename: filePath,
        filenameRelative: filePath,
        plugins: [linkerBabelPlugin],
        sourceMaps: 'inline',
      });
      return {contents: code};
    });
  },
};

export default {
  resolveExtensions: ['.mjs', '.js'],
  // Note: `@bazel/esbuild` has a bug and does not pass-through the format from Starlark.
  format: 'esm',
  plugins: [linkerEsbuildPlugin]
};
