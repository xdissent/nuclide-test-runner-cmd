
# nuclide-test-runner-cmd

This package adds a Nuclide test runner for an arbitrary command. Test status
is determined by exit code.

## Configuration

| Option      | Type        | Default           | Description |
| :---------- | :---------- | :---------------- | :------------- |
| `command`   | `string`    | `'npm'`           | Command to run |
| `args`      | `string[]`  | `['test']`        | Arguments for the command |
| `label`     | `string`    | `'npm test'`      | Label visible in the Nuclide test runner dropdown |
| `sentinel`  | `string`    | `'package.json'`  | File whose existence in a parent directory determines `cwd` for the command |
