require('./sher.cjs');

(async () => {
  const fs = require('fs');
  const path = require('path');

  // create a simple tar
  const tarBallPath = await createSimplePackageTar();
  // createa a symlink to it
  const symlinkedTarPath = await createSymlinkToTarball(tarBallPath);

  console.log(tarBallPath, symlinkedTarPath);

  console.log(
    await packageJsonAndInstall({
      dependencies: {
        [`my-test-pkg`]: `file:${symlinkedTarPath}`,
      },
    }),
  );

  // await fs.promises.unlink(symlinkedTarPath);
  // await fs.promises.unlink(tarBallPath);

  //expect(installPromise).resolves.toBeTruthy();

  //
  // Helpers
  //

  async function createSymlinkToTarball(tarballPath) {
    const symlinkPath = path.resolve(
      '/tmp/somewhere/nested/symlinked-package-tar-' + Math.random() * 100 + '.tgz',
    );
    await fs.promises.mkdir(path.dirname(symlinkPath), {recursive: true});
    await fs.promises.link(tarballPath, symlinkPath);
    return symlinkPath;
  }

  async function createSimplePackageTar() {
    const tmpDir = path.resolve('/tmp/somewhere-else/nested/my-simple-package-tar-folder');
    const pkgJsonPath = path.join(tmpDir, 'package.json');
    const tarOutPath = path.resolve('/tmp/my-tar-pkg-' + Math.random() * 100 + '.tgz');

    await fs.promises.mkdir(tmpDir, {recursive: true});
    await fs.promises.writeFile(
      pkgJsonPath,
      JSON.stringify(
        {
          name: 'test',
          version: '0.0.' + Math.random * 100,
        },
        null,
        2,
      ),
    );

    await yarn('pack', '--out', tarOutPath, {cwd: tmpDir});
    await fs.promises.rm(tmpDir, {recursive: true});

    return tarOutPath;
  }
})();
