/**
 * Deploy Workflow Tests
 *
 * Tests GitHub Actions deployment workflow:
 * - Vercel deployment configuration
 * - Environment setup
 * - Deployment steps
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import path from 'path';

describe('Deploy Workflow Configuration', () => {
  const deployWorkflowPath = path.join(process.cwd(), '.github/workflows/deploy.yml');
  let deployWorkflow: Record<string, unknown>;

  it('should have valid deploy workflow file', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;

    expect(deployWorkflow).toBeDefined();
    expect(deployWorkflow.name).toBe('Deploy to Vercel');
  });

  it('should trigger after CI succeeds on main', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const on = deployWorkflow.on as {
      workflow_run: { workflows: string[]; types: string[]; branches: string[] };
    };

    expect(on.workflow_run.workflows).toContain('CI - Build and Test');
    expect(on.workflow_run.types).toContain('completed');
    expect(on.workflow_run.branches).toContain('main');
  });

  it('should support manual workflow dispatch', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const on = deployWorkflow.on as { workflow_dispatch?: unknown };

    expect(on.workflow_dispatch).toBeDefined();
  });

  it('should have deploy job', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { name: string }>;

    expect(jobs.deploy).toBeDefined();
    expect(jobs.deploy.name).toBe('Deploy to Production');
  });

  it('should use ubuntu-latest runner', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { 'runs-on': string }>;

    expect(jobs.deploy['runs-on']).toBe('ubuntu-latest');
  });

  it('should have 20 minute timeout', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { 'timeout-minutes': number }>;

    expect(jobs.deploy['timeout-minutes']).toBe(20);
  });

  it('should install Vercel CLI', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { steps: Array<{ name: string; run?: string }> }>;
    const installStep = jobs.deploy.steps.find((s) => s.name === 'Install Vercel CLI');

    expect(installStep).toBeDefined();
    expect(installStep?.run).toContain('npm install --global vercel@latest');
  });

  it('should pull Vercel environment', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { steps: Array<{ name: string; run?: string; env?: Record<string, string> }> }>;
    const pullStep = jobs.deploy.steps.find((s) => s.name === 'Pull Vercel environment');

    expect(pullStep).toBeDefined();
    expect(pullStep?.run).toContain('vercel pull');
    expect(pullStep?.run).toContain('--environment=production');
    expect(pullStep?.env?.VERCEL_ORG_ID).toContain('secrets.VERCEL_ORG_ID');
    expect(pullStep?.env?.VERCEL_PROJECT_ID).toContain('secrets.VERCEL_PROJECT_ID');
  });

  it('should build with Vercel', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { steps: Array<{ name: string; run?: string }> }>;
    const buildStep = jobs.deploy.steps.find((s) => s.name === 'Build project artifacts');

    expect(buildStep).toBeDefined();
    expect(buildStep?.run).toContain('vercel build --prod');
  });

  it('should deploy to Vercel', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { steps: Array<{ name: string; run?: string }> }>;
    const deployStep = jobs.deploy.steps.find((s) => s.name === 'Deploy to production');

    expect(deployStep).toBeDefined();
    expect(deployStep?.run).toContain('vercel deploy --prebuilt --prod');
  });

  it('should display deployment status', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content) as Record<string, unknown>;
    const jobs = deployWorkflow.jobs as Record<string, { steps: Array<{ name: string; run?: string }> }>;
    const statusStep = jobs.deploy.steps.find((s) => s.name === 'Deployment status');

    expect(statusStep).toBeDefined();
    expect(statusStep?.run).toContain('Deployment completed');
    expect(statusStep?.run).toContain('hoteletuna.com');
  });
});

describe('Vercel Configuration', () => {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');

  it('should have valid vercel.json', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    const vercelConfig = JSON.parse(content);

    expect(vercelConfig).toBeDefined();
  });

  it('should use correct framework', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    const vercelConfig = JSON.parse(content);

    expect(vercelConfig.framework).toBe('nextjs');
  });

  it('should have security headers', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    const vercelConfig = JSON.parse(content);

    expect(vercelConfig.headers).toBeDefined();
    expect(vercelConfig.headers.length).toBeGreaterThan(0);

    const securityHeaders = vercelConfig.headers[0].headers;
    const headerKeys = securityHeaders.map((h: { key: string }) => h.key);

    expect(headerKeys).toContain('X-Content-Type-Options');
    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('X-XSS-Protection');
    expect(headerKeys).toContain('Referrer-Policy');
  });

  it('should have cron jobs configured', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    const vercelConfig = JSON.parse(content);

    expect(vercelConfig.crons).toBeDefined();
    expect(vercelConfig.crons.length).toBeGreaterThan(0);

    const cronPaths = vercelConfig.crons.map((c: { path: string }) => c.path);
    expect(cronPaths).toContain('/api/cron/email-inbox-monitor');
    expect(cronPaths).toContain('/api/cron/uptime-monitor');
  });

  it('should deploy to correct region', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    const vercelConfig = JSON.parse(content);

    expect(vercelConfig.regions).toBeDefined();
    expect(vercelConfig.regions).toContain('iad1');
  });
});

describe('Vercel Project Configuration', () => {
  const vercelProjectPath = path.join(process.cwd(), '.vercel/project.json');

  it('should have valid project.json when linked locally', () => {
    if (!existsSync(vercelProjectPath)) {
      expect(true).toBe(true);
      return;
    }
    const content = readFileSync(vercelProjectPath, 'utf-8');
    const vercelProject = JSON.parse(content);

    expect(vercelProject).toBeDefined();
    expect(vercelProject.projectName).toBe('hotel-etuna');
    expect(vercelProject.orgId).toBeTruthy();
    expect(vercelProject.projectId).toBeTruthy();
  });
});
