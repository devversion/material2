load("//:packages.bzl", "ANGULAR_PACKAGES")
load("//tools/esbuild:index.bzl", "esbuild", "esbuild_amd", "esbuild_config")
load("@build_bazel_rules_nodejs//:index.bzl", "js_library")
load("@build_bazel_rules_nodejs//internal/linker:link_node_modules.bzl", "LinkerPackageMappingInfo")
load("@build_bazel_rules_nodejs//:providers.bzl", "JSModuleInfo", "js_module_info")
load("@bazel_skylib//lib:paths.bzl", "paths")
load("@npm//@angular/dev-infra-private/bazel:extract_js_module_output.bzl", "extract_js_module_output")
load("//tools/angular:index.bzl", "LINKER_PROCESSED_FW_PACKAGES")

def _is_spec_file(file):
    basename = file.basename
    # External files (from other workspaces) should never run as specs.
    if (file.short_path.startswith("../")):
        return False
    # `spec.js` or `spec.mjs` files will be imported in the entry-point.
    return basename.endswith("spec.js") or basename.endswith("spec.mjs")

def _filter_spec_files(files):
    result = []
    for file in files:
        if _is_spec_file(file):
            result.append(file)
    return result

def _create_entrypoint_file(base_package, spec_files):
    output = ""
    for file in spec_files:
        base_dir_segments = "/".join([".."] * len(base_package.split("/")))
        output += """import "%s/%s";\n""" % (base_dir_segments, file.short_path)
    return output

def _spec_entrypoint_impl(ctx):
    output = ctx.actions.declare_file("%s.mjs" % ctx.attr.name)
    spec_depsets = []

    for dep in ctx.attr.deps:
        if JSModuleInfo in dep:
            spec_depsets.append(dep[JSModuleInfo].sources)
        else:
            spec_depsets.append(dep[DefaultInfo].files)

    spec_files = []

    for spec_depset in spec_depsets:
        # Note: `to_list()` is an expensive operation but we need to do this for every
        # dependency here in order to be able to filter out spec files from depsets.
        spec_files.extend(_filter_spec_files(spec_depset.to_list()))

    ctx.actions.write(
        output = output,
        content = _create_entrypoint_file(ctx.label.package, spec_files)
    )

    out_depset = depset([output])

    return [
        DefaultInfo(files = out_depset),
        JSModuleInfo(
            direct_sources = out_depset,
            sources = depset(transitive = [out_depset] + spec_depsets),
        )
    ]

_spec_entrypoint = rule(
    implementation = _spec_entrypoint_impl,
    attrs = {
        "deps": attr.label_list(allow_files = False, mandatory = True),
    }
)

def spec_bundle(name, platform, deps, **kwargs):
    is_browser_test = platform == "browser"
    package_name = native.package_name()
    workspace = "angular_material"

    _spec_entrypoint(
        name = "%s_spec_entrypoint" % name,
        deps = deps,
        testonly = True,
    )

    # Browser tests (Karma) need named AMD modules to load.
    esbuild_rule = esbuild_amd if is_browser_test else esbuild
    amd_name =  "%s/%s/%s" % (workspace, package_name, name + "_spec") if is_browser_test else None

    esbuild_rule(
        name = "%s_bundle" % name,
        testonly = True,
        config = "//tools/spec-bundling:esbuild_config",
        entry_point = ":%s_spec_entrypoint" % name,
        module_name = amd_name,
        output = "%s_spec.js" % name,
        # We cannot use `ES2017` or higher as that would result in `async/await` not being downleveled.
        # ZoneJS needs to be able to intercept these as otherwise change detection would not work properly.
        target = "es2016",
        platform = platform,
         # Note: We add all linker-processed FW packages as dependencies here so that ESBuild will
         # map all framework packages to their linker-processed bundles from `tools/angular`.
        deps = deps + LINKER_PROCESSED_FW_PACKAGES + [":%s_spec_entrypoint" % name],
        **kwargs
    )

    js_library(
        name = name,
        testonly = True,
        named_module_srcs = [":%s_bundle" % name],
    )

