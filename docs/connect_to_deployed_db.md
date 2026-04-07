# Connect to the deployed database (RDS)

RDS runs in private subnets and is only reachable from the VPC (for example from ECS tasks). For local access, Terraform provisions an **SSM-only bastion** EC2 instance: no SSH, no public IP. You connect with **AWS Systems Manager Session Manager** using the document `AWS-StartPortForwardingSessionToRemoteHost`, which tunnels `localhost:<localPort>` to `RDS:5432` through that instance.

Implementation: Terraform module `infrastructure/modules/bastion` (SSM VPC endpoints, security group rule allowing the bastion to reach RDS on 5432).

## Prerequisites

1. **AWS CLI v2** configured for the correct account and region (Revendiste uses `sa-east-1` by default).
2. **Session Manager plugin for the AWS CLI** — required for `aws ssm start-session` and port forwarding. It is **not** always bundled with the CLI; install it if commands fail with a missing plugin error.
   - Install: [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
3. **IAM permissions** on your user or role (not defined in this repo — your admin must grant them), for example:
   - `ssm:StartSession` on the bastion instance (or a tagged resource set)
   - Access to document `AWS-StartPortForwardingSessionToRemoteHost`
   - `ssm:TerminateSession` / `ssm:ResumeSession` as needed

## Check if the Session Manager plugin is installed

**Git Bash, WSL, macOS, Linux:**

```bash
session-manager-plugin --version
```

A version string (for example `1.2.764.0`) means it is on your `PATH`. `command not found` means it is missing or not on `PATH`.

**Windows (PowerShell or CMD):**

```powershell
session-manager-plugin --version
```

If the command is not found, the default install location is often:

`C:\Program Files\Amazon\SessionManagerPlugin\bin\`

Add that folder to your `PATH`, or invoke the executable with the full path. Open a **new** terminal after changing `PATH`.

**Sanity check with AWS:**

```bash
aws --version
```

To confirm end-to-end access (use a real instance ID you are allowed to use):

```bash
aws ssm start-session --target i-0123456789abcdef0 --region sa-east-1
```

## Open a tunnel to RDS

From the Terraform environment directory (`development` or `production`):

```bash
cd infrastructure/environments/development   # or production
terraform output -raw db_tunnel_command
```

Run the printed command. It looks like:

```bash
aws ssm start-session \
  --target <bastion_instance_id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds_hostname>"],"portNumber":["5432"],"localPortNumber":["<local_port>"]}' \
  --region sa-east-1
```

Notes:

- **`host`** must be the RDS **hostname only** (same as `terraform output -raw rds_address`), not `host:5432`.
- **Local port**: `production` output uses **`5433`** by default (avoids clashing with a local PostgreSQL on 5432). **`development`** output uses **`5432`** by default. Adjust `localPortNumber` in the parameters if you need a different local port.
- Leave this session running while you connect from another terminal.

Other useful outputs:

```bash
terraform output -raw bastion_instance_id
terraform output -raw rds_address
```

(`db_tunnel_command` and `rds_address` are sensitive outputs in Terraform.)

## Connect with psql or a GUI

With the tunnel running, point your client at **localhost** and the **local** port from the command (for example `5433` in production).

```bash
psql -h 127.0.0.1 -p 5433 -U <db_username> -d revendiste
```

**Credentials** (username/password) live in **AWS Secrets Manager**. Terraform exposes the database secret ARN (for example `db_secret_arn`). Read the secret in the console or with the AWS CLI and use the JSON fields your stack stores (often `username` / `password`).

## Alternative: EC2 Instance Connect tunnel script

The repo script `scripts/db-tunnel.sh` uses **EC2 Instance Connect** (`open-tunnel` to the RDS private IP), not Session Manager. For SSM-based access, use **`terraform output -raw db_tunnel_command`** as above.

## Related

- ECS Exec (also uses the Session Manager plugin): [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — *Accessing Running Containers (ECS Exec)*
- Infrastructure overview: [infrastructure/README.md](../infrastructure/README.md)
