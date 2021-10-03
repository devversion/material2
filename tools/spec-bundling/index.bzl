load("//:packages.bzl", "ANGULAR_PACKAGES")
load("//tools/esbuild:index.bzl", "esbuild", "esbuild_amd", "esbuild_config")
load("@build_bazel_rules_nodejs//:index.bzl", "js_library")
load("@build_bazel_rules_nodejs//internal/linker:link_node_modules.bzl", "LinkerPackageMappingInfo")
load("@build_bazel_rules_nodejs//:providers.bzl", "JSModuleInfo", "js_module_info")
load("@bazel_skylib//lib:paths.bzl", "paths")
load("@npm//@angular/dev-infra-private/bazel:extract_js_module_output.bzl", "extract_js_module_output")
load("//tools/angular:index.bzl", "LINKER_PROCESSED_FW_PACKAGES")

def _filter_spec_files(files):
    result = []
    for file in files:
        basename = file.basename
        if basename.endswith(".spec.js") or basename.endswith(".spec.mjs"):
            result.append(file)
    return result

def _create_entrypoint_file(base_package, spec_files):
    output = ""
    for file in spec_files:
        specifier = "%s" % paths.relativize(file.short_path, base_package)
        output += """import "./%s";\n""" % specifier
    return output

def _spec_entrypoint_impl(ctx):
    output = ctx.actions.declare_file("%s.mjs" % ctx.attr.name)
    spec_files = []

    for dep in ctx.attr.deps:
        if JSModuleInfo in dep:
            # Note: `to_list()` is an expensive operation but we need to do this for every
            # dependency here in order to be able to filter out spec files from depsets.
            js_sources = dep[JSModuleInfo].sources.to_list()
            spec_files.extend(_filter_spec_files(js_sources))


    ctx.actions.write(
        output = output,
        content = _create_entrypoint_file(ctx.label.package, spec_files)
    )

    output_depset = depset([output])

    return [
        DefaultInfo(files = output_depset),
        js_module_info(output_depset)
    ]

_spec_entrypoint = rule(
    implementation = _spec_entrypoint_impl,
    attrs = {
        "deps": attr.label_list(allow_files = False, mandatory = True),
    }
)

def spec_bundle(name, deps):
    _spec_entrypoint(
        name = "%s_spec_entrypoint" % name,
        deps = deps,
        testonly = True,
    )

    esbuild_amd(
        name = "%s_bundle" % name,
        testonly = True,
        config = "//tools/spec-bundling:esbuild_config",
        entry_point = ":%s_spec_entrypoint" % name,
        module_name = "angular_material/%s/%s" % (native.package_name(), name + "_spec"),
        output = "%s_spec.js" % name,
         # Note: We add all linker-processed FW packages as dependencies here so that ESBuild will
         # map all framework packages to their linker-processed bundles from `tools/angular`.
        deps = deps + LINKER_PROCESSED_FW_PACKAGES + [":%s_spec_entrypoint" % name],
    )

    js_library(
        name = name,
        testonly = True,
        named_module_srcs = [":%s_bundle" % name],
    )

