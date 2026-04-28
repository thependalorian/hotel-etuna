/**
 * Deploy Workflow Tests
 * 
 * Tests GitHub Actions deployment workflow:
 * - Vercel deployment configuration
 * - Environment setup
 * - Deployment steps
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import path from 'path';

describe('Deploy Workflow Configuration', () => {
  const deployWorkflowPath = path.join(process.cwd(), '.github/workflows/deploy.yml');
  let deployWorkflow: any;

  it('should have valid deploy workflow file', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);
    
    expect(deployWorkflow).toBeDefined();
    expect(deployWorkflow.name).toBe('Deploy to Vercel');
  });

  it('should trigger on main branch push', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    expect(deployWorkflow.on.push.branches).toContain('main');
  });

  it('should support manual workflow dispatch', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    expect(deployWorkflow.on.workflow_dispatch).toBeDefined();
  });

  it('should have deploy job', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    expect(deployWorkflow.jobs.deploy).toBeDefined();
    expect(deployWorkflow.jobs.deploy.name).toBe('Deploy to Production');
  });

  it('should use ubuntu-latest runner', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    expect(deployWorkflow.jobs.deploy['runs-on']).toBe('ubuntu-latest');
  });

  it('should have 20 minute timeout', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    expect(deployWorkflow.jobs.deploy['timeout-minutes']).toBe(20);
  });

  it('should install Vercel CLI', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const installStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Install Vercel CLI'
    );
    
    expect(installStep).toBeDefined();
    expect(installStep.run).toContain('npm install --global vercel@latest');
  });

  it('should pull Vercel environment', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const pullStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Pull Vercel Environment Information'
    );
    
    expect(pullStep).toBeDefined();
    expect(pullStep.run).toContain('vercel pull');
    expect(pullStep.run).toContain('--environment=production');
  });

  it('should build with Vercel', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const buildStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Build Project Artifacts'
    );
    
    expect(buildStep).toBeDefined();
    expect(buildStep.run).toContain('vercel build --prod');
  });

  it('should deploy to Vercel', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const deployStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Deploy Project Artifacts to Vercel'
    );
    
    expect(deployStep).toBeDefined();
    expect(deployStep.run).toContain('vercel deploy --prebuilt --prod');
  });

  it('should use Vercel secrets', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const pullStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Pull Vercel Environment Information'
    );
    
    expect(pullStep.env.VERCEL_ORG_ID).toContain('secrets.VERCEL_ORG_ID');
    expect(pullStep.env.VERCEL_PROJECT_ID).toContain('secrets.VERCEL_PROJECT_ID');
  });

  it('should display deployment status', () => {
    const content = readFileSync(deployWorkflowPath, 'utf-8');
    deployWorkflow = parse(content);

    const statusStep = deployWorkflow.jobs.deploy.steps.find((s: any) => 
      s.name === 'Deployment Status'
    );
    
    expect(statusStep).toBeDefined();
    expect(statusStep.run).toContain('Deployment completed successfully');
  });
});

describe('Vercel Configuration', () => {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  let vercelConfig: any;

  it('should have valid vercel.json', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    vercelConfig = JSON.parse(content);
    
    expect(vercelConfig).toBeDefined();
  });

  it('should use correct framework', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    vercelConfig = JSON.parse(content);

    expect(vercelConfig.framework).toBe('nextjs');
  });

  it('should have security headers', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    vercelConfig = JSON.parse(content);

    expect(vercelConfig.headers).toBeDefined();
    expect(vercelConfig.headers.length).toBeGreaterThan(0);

    const securityHeaders = vercelConfig.headers[0].headers;
    const headerKeys = securityHeaders.map((h: any) => h.key);

    expect(headerKeys).toContain('X-Content-Type-Options');
    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('X-XSS-Protection');
    expect(headerKeys).toContain('Referrer-Policy');
  });

  it('should have cron jobs configured', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    vercelConfig = JSON.parse(content);

    expect(vercelConfig.crons).toBeDefined();
    expect(vercelConfig.crons.length).toBeGreaterThan(0);

    const cronPaths = vercelConfig.crons.map((c: any) => c.path);
    expect(cronPaths).toContain('/api/cron/email-inbox-monitor');
    expect(cronPaths).toContain('/api/cron/uptime-monitor');
  });

  it('should deploy to correct region', () => {
    const content = readFileSync(vercelConfigPath, 'utf-8');
    vercelConfig = JSON.parse(content);

    expect(vercelConfig.regions).toBeDefined();
    expect(vercelConfig.regions).toContain('iad1'); // US East
  });
});

describe('Vercel Project Configuration', () => {
  const vercelProjectPath = path.join(process.cwd(), '.vercel/project.json');
  let vercelProject: any;

  it('should have valid project.json', () => {
    const content = readFileSync(vercelProjectPath, 'utf-8');
    vercelProject = JSON.parse(content);
    
    expect(vercelProject).toBeDefined();
  });

  it('should have correct project ID', () => {
    const content = readFileSync(vercelProjectPath, 'utf-8');
    vercelProject = JSON.parse(content);

    expect(vercelProject.projectId).toBe('prj_1GjNB8oTxlKUytg6oOvxYWMLeC6W');
  });

  it('should have correct org ID', () => {
    const content = readFileSync(vercelProjectPath, 'utf-8');
    vercelProject = JSON.parse(content);

    expect(vercelProject.orgId).toBe('team_MPOdmWd6KnPpGhXI9UYg2Opo');
  });

  it('should have correct project name', () => {
    const content = readFileSync(vercelProjectPath, 'utf-8');
    vercelProject = JSON.parse(content);

    expect(vercelProject.projectName).toBe('hotel-etuna');
  });
});
