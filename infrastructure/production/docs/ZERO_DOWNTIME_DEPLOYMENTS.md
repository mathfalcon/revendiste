# Zero-Downtime Deployments with Single Task

## How It Works

**Yes, zero-downtime deployments work with `desired_count = 1`!**

The key is the ECS deployment configuration:

- **`deployment_maximum_percent = 200`**: Allows temporarily running 2x tasks during deployment
- **`deployment_minimum_healthy_percent = 100`**: Ensures at least 1 task stays healthy at all times

## Deployment Flow

With `desired_count = 1`, here's what happens during a deployment:

1. **Initial State**: 1 task running (old version)
   - Task is healthy and registered with ALB
   - ALB routes traffic to this task

2. **Deployment Starts**: ECS starts new task
   - Now 2 tasks running (1 old + 1 new)
   - Old task continues serving traffic
   - New task starts up and runs health checks

3. **New Task Becomes Healthy**:
   - New task passes health checks
   - New task is registered with ALB
   - ALB starts routing new requests to new task
   - Old task continues serving existing connections

4. **Traffic Transition**:
   - ALB gracefully drains connections from old task
   - New connections go to new task
   - Old task finishes serving existing requests

5. **Old Task Stopped**:
   - Old task is deregistered from ALB
   - Old task is stopped
   - Final state: 1 task running (new version)

## Why This Works

### Application Load Balancer (ALB) Handles Traffic

The ALB is the key component that enables zero-downtime:

- **Connection Draining**: ALB waits for existing connections to complete before removing a task
- **Health Checks**: ALB only routes traffic to healthy tasks
- **Gradual Transition**: Traffic shifts from old to new task automatically

### ECS Deployment Settings

```hcl
deployment_maximum_percent = 200        # Can run 2 tasks temporarily
deployment_minimum_healthy_percent = 100 # Must keep 1 task healthy
```

**Math:**
- Maximum tasks during deployment: `1 × 200% = 2 tasks`
- Minimum healthy tasks: `1 × 100% = 1 task`

This ensures:
- Old task stays running until new task is healthy
- No gap where zero tasks are running
- Smooth traffic transition via ALB

## Comparison: 1 Task vs 2 Tasks

| Aspect | desired_count = 1 | desired_count = 2 |
|--------|-------------------|-------------------|
| **Zero-downtime** | ✅ Yes (with ALB) | ✅ Yes |
| **Cost** | Lower (~$30/month) | Higher (~$60/month) |
| **Deployment** | Temporarily 2 tasks | Temporarily 4 tasks |
| **Risk** | Low (ALB handles transition) | Very low (redundancy) |
| **Best for** | Pre-launch, low traffic | Production, high traffic |

## When to Use 1 Task vs 2 Tasks

### Use `desired_count = 1` when:
- ✅ Pre-launch or early stage
- ✅ Low to moderate traffic
- ✅ Cost optimization is priority
- ✅ Can tolerate brief service degradation if new task fails

### Use `desired_count = 2` when:
- ✅ Production with significant traffic
- ✅ Need redundancy (survive single task failure)
- ✅ Higher availability requirements
- ✅ Can afford the extra cost

## Safety Considerations

### With `desired_count = 1`:

**Pros:**
- ✅ Zero-downtime deployments work
- ✅ Lower cost
- ✅ Autoscaling still handles traffic spikes

**Cons:**
- ⚠️ No redundancy (single task failure = downtime)
- ⚠️ If new task fails health checks, deployment rolls back (circuit breaker)
- ⚠️ Brief moment where only 1 task exists (old or new)

### Mitigation Strategies:

1. **Health Checks**: Ensure health checks are robust
   - Fast startup time
   - Accurate health detection
   - Proper timeout settings

2. **Circuit Breaker**: Already enabled
   - Automatically rolls back if new task fails
   - Prevents bad deployments from causing downtime

3. **Autoscaling**: Handles traffic spikes
   - Scales up automatically when needed
   - Provides redundancy during high traffic

4. **Monitoring**: CloudWatch alarms alert on issues
   - Know immediately if deployment fails
   - Can manually intervene if needed

## Deployment Example

```bash
# Deploy new version
aws ecs update-service \
  --cluster revendiste-production-cluster \
  --service revendiste-production-backend \
  --task-definition revendiste-production-backend:123

# What happens:
# 1. ECS starts new task (now 2 tasks: old + new)
# 2. New task passes health checks
# 3. ALB registers new task
# 4. ALB drains old task connections
# 5. Old task stopped (back to 1 task: new)
# Total time: ~30-60 seconds
# Downtime: 0 seconds ✅
```

## Troubleshooting

### Deployment Fails

If new task fails health checks:
- Circuit breaker automatically rolls back
- Old task continues running
- No downtime, but deployment fails
- Check logs to see why new task failed

### Deployment Takes Too Long

If deployment seems stuck:
- Check CloudWatch logs for new task
- Verify health check endpoint is working
- Check ALB target group health
- May need to adjust health check timeout

### Want More Safety?

If you want extra redundancy during deployments:
- Set `desired_count = 2` (costs more)
- Or use `deployment_minimum_healthy_percent = 100` with `desired_count = 1` (current setup)

## Summary

**Zero-downtime deployments work with `desired_count = 1`** because:

1. ✅ ECS temporarily runs 2 tasks during deployment
2. ✅ ALB handles smooth traffic transition
3. ✅ Old task stays running until new task is healthy
4. ✅ Circuit breaker prevents bad deployments

**Trade-off**: Lower cost vs. less redundancy. For pre-launch, this is a good balance.
