# PowerShell script for ECS Exec (Windows native)
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "frontend")]
    [string]$Service,
    
    [string]$Command = "sh"
)

$ClusterName = "revendiste-production-cluster"
$ServiceName = "revendiste-production-$Service"
$ContainerName = $Service
$Region = "sa-east-1"

Write-Host "Finding running tasks for $ServiceName..." -ForegroundColor Yellow

# Get task
$TaskArn = (aws ecs list-tasks --cluster $ClusterName --service-name $ServiceName --region $Region --query 'taskArns[0]' --output text)

if ([string]::IsNullOrEmpty($TaskArn) -or $TaskArn -eq "None") {
    Write-Host "Error: No running tasks found" -ForegroundColor Red
    exit 1
}

$TaskId = $TaskArn.Split('/')[-1]
Write-Host "Found task: $TaskId" -ForegroundColor Green
Write-Host ""

if ($Command -eq "sh") {
    Write-Host "Opening interactive shell..." -ForegroundColor Yellow
    Write-Host "Type 'exit' to disconnect" -ForegroundColor Yellow
    Write-Host ""
}

aws ecs execute-command `
    --cluster $ClusterName `
    --task $TaskId `
    --container $ContainerName `
    --interactive `
    --command $Command `
    --region $Region
