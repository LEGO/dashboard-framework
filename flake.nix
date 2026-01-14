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

            (writeShellScriptBin "upload" ''
              ${pkgs.s5cmd}/bin/s5cmd sync \
                --cache-control="max-age=31536000, s-maxage=31536000, stale-while-revalidate=3600, stale-if-error=1209600, no-transform, public" \
                ./dist/ s3://s3.elates.it/dashboard-generator/
            '')
          ];

          shellHook = ''
            set -a
            source <(${pkgs.sops}/bin/sops --decrypt ./.sops.env)
            set +a
          '';
        };
      }
    );
}
