load("//:packages.bzl", "ANGULAR_PACKAGES")
load("//tools/esbuild:index.bzl", "esbuild", "esbuild_amd", "esbuild_config")
load("@build_bazel_rules_nodejs//:index.bzl", "js_library")
load("@build_bazel_rules_nodejs//internal/linker:link_node_modules.bzl", "LinkerPackageMappingInfo")

def _linker_mapping_impl(ctx):
    return [
        DefaultInfo(files = depset(ctx.files.srcs)),
        LinkerPackageMappingInfo(
            mappings = {
                ctx.attr.module_name: "%s/%s" % (ctx.label.package, ctx.attr.subpath),
            }
        )
    ]

_linker_mapping = rule(
    implementation = _linker_mapping_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = False),
        "subpath": attr.string(),
        "module_name": attr.string(),
    }
)

def _get_target_name_base(pkg, entry_point):
    return "%s%s" % (pkg.name, "_%s" % entry_point if entry_point else "")

def _create_bundle_targets(pkg, entry_point, module_name):
    target_name_base = _get_target_name_base(pkg, entry_point)
    fesm_bundle_path = "fesm2020/%s.mjs" % (entry_point if entry_point else pkg.name)

    esbuild(
        name = "%s_linked_bundle" % target_name_base,
        output = "%s/index.mjs" % target_name_base,
        entry_point = "@npm//:node_modules/@angular/%s/%s" % (pkg.name, fesm_bundle_path),
        config = "//tools/angular:esbuild_config",
        external = ["rxjs", "@angular"],
    )

    _linker_mapping(
        name = "%s_linked" % target_name_base,
        srcs = [":%s_linked_bundle" % target_name_base],
        module_name = module_name,
        subpath = target_name_base,
    )

def create_angular_bundle_targets():
    for pkg in ANGULAR_PACKAGES:
        _create_bundle_targets(pkg, None, pkg.module_name)

        for entry_point in pkg.entry_points:
            _create_bundle_targets(pkg, entry_point, "%s/%s" % (pkg.module_name, entry_point))


LINKER_PROCESSED_FW_PACKAGES = [
    "//tools/angular:%s_linked" % _get_target_name_base(pkg, entry_point)
    for pkg in ANGULAR_PACKAGES
    for entry_point in [None] + pkg.entry_points
]
