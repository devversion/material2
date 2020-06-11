def _custom_rule_impl(ctx):
    output_dir = ctx.actions.declare_directory("./chrome-out")
    fx = ctx.actions.declare_file("./hello.txt")

    ctx.actions.run_shell(
        command = """
          sleep 10
          out_path="$1"
          touch $2
          mkdir -p "$out_path/Some Path"
          touch "$out_path/Some Path/file.txt"
        """,
        arguments = [output_dir.path, fx.path],
        inputs = [],
        progress_message = "BUilding!!",
        outputs = [output_dir, fx]
    )

    return [DefaultInfo(files = depset([output_dir, fx]))]


custom_rule = rule(
    implementation = _custom_rule_impl,
    attrs = {
    },
)
