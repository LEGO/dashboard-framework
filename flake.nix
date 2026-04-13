{
  description = "Dashboard Builder";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  nixConfig = {
    extra-substituters = [
      "https://cache.nixos.org"
    ];
    extra-trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

  outputs = {
    nixpkgs,
    utils,
    ...
  }:
    utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShell = pkgs.mkShell {
          packages = with pkgs; [
            bun
            s5cmd
            sops
            podman

            (writeShellScriptBin "container-build" ''
              ${pkgs.podman}/bin/podman build . -t ghcr.io/LEGO/dashboard-framework:$(${pkgs.git}/bin/git rev-parse --short HEAD)
            '')

            (writeShellScriptBin "container-push" ''
              ${pkgs.podman}/bin/podman push ghcr.io/LEGO/dashboard-framework:$(${pkgs.git}/bin/git rev-parse --short HEAD)
            '')
          ];
        };
      }
    );
}
