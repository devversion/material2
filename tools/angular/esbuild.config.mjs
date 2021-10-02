/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import linkerPlugin from '@angular/compiler-cli/linker/babel';
import babel from '@babel/core';
import fs from 'fs';

const linkerEsbuildPlugin = {
  name: 'ng-linker-esbuild',
  setup: (build) => {
    build.onLoad({filter: /fesm2020/}, async (args) => {
      const filePath = args.path;
      const content = await fs.promises.readFile(filePath, 'utf8');
      const {code} = await babel.transformAsync(content,  {
        filename: filePath,
        filenameRelative: filePath,
        plugins: [linkerPlugin],
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
