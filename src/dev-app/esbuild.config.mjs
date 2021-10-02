/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export default {
  resolveExtensions: ['.mjs', '.js'],
  // Note: `@bazel/esbuild` has a bug and does not pass-through the format from Starlark.
  format: 'esm',
};
