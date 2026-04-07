# Dashboard Framework

Dashboard Framework helps creating intuitive, and valuable Grafana Dashboards
by asking simple questions and by focusing on what telemetry data would be
more useful to show, rather than how to structure it.

> [!NOTE]
> This project is currently developed for internal use, but may later be
> developed for broader consumption

## Usage

To run the project locally you need [Nix](https://nixos.org/) installed and
available. It will install and prepare all the dependencies needed. We
run and test the project on macOS and GNU/Linux.

To access the development shell run:

```shell
nix develop
```

After that you can install the node_modules and start the server:

```shell
bun install

bun run dev
```

You can then open a browser to [localhost:3000](http://localhost:3000) and
use the dashboard framework while working on it.

# Contributing

Contributions are more than welcome. By sending PRs (pull request), you agree
to license your work under the same license as this repository.
Please read and get familiar with the [contributing guidelines](CONTRIBUTING,md)
before opening a PR.

As this project is in the early stages of development, we are still working
on the contribution guidelines and best practices. We appreciate your patience
and understanding as we work to improve the project.

# License

This project is under the MIT License. See the [LICENSE](./LICENSE).
