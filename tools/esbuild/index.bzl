load("@npm//@bazel/esbuild:index.bzl", _esbuild = "esbuild", _esbuild_config = "esbuild_config")
load("@npm//@angular/dev-infra-private/bazel:expand_template.bzl", "expand_template")
load("@npm//@angular/dev-infra-private/bazel:extract_js_module_output.bzl", "extract_js_module_output")

# Re-export of the actual esbuild definitions.
esbuild = _esbuild
esbuild_config = _esbuild_config

def esbuild(name, deps = [], **kwargs):
    # Collects all ES5 JavaScript files which are required to serve the dev-app. By default,
    # ts_library and ng_module targets only expose the type definition files as outputs.
    extract_js_module_output(
        name = "%s_sources" % name,
        include_declarations = False,
        include_default_files = True,
        # `JSModuleInfo` resolves to the ES5 sources from TypeScript targets. See:
        # https://github.com/bazelbuild/rules_nodejs/blob/stable/packages/typescript/internal/build_defs.bzl#L334-L337
        # Note: We cannot use the named JS module provider because not all dependencies are
        # necessarily captured as named module. See: https://github.com/angular/components/commit/94289397cac94ca86a292b2cd64945df52bbb7fb.
        provider = "JSNamedModuleInfo",
        tags = ["manual"],
        deps = [":dev-app"],
    )

"""Generates an AMD bundle for the specified entry-point with the given AMD module name."""

def esbuild_amd(name, entry_point, module_name, testonly = False, deps = []):
    expand_template(
        name = "%s_config" % name,
        testonly = testonly,
        template = "//tools/esbuild:esbuild-amd-config.mjs",
        output_name = "%s_config.mjs" % name,
        substitutions = {
            "TMPL_MODULE_NAME": module_name,
        },
    )

    _esbuild_config(
        name = "%s_config_lib" % name,
        testonly = testonly,
        config_file = "%s_config" % name,
    )

    _esbuild(
        name = "%s_bundle" % name,
        testonly = testonly,
        deps = deps,
        minify = True,
        sourcemap = "inline",
        platform = "browser",
        target = "es2015",
        entry_point = entry_point,
        config = "%s_config_lib" % name,
    )

    native.filegroup(
        name = name,
        testonly = testonly,
        srcs = ["%s_bundle" % name],
    )
