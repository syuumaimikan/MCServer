import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

/**
 * Executes a git command safely in the specified server directory
 */
function runGit(serverDir, args) {
  try {
    return execFileSync('git', args, {
      cwd: serverDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'CraftOS AutoCommit',
        GIT_AUTHOR_EMAIL: 'craftos@antigravity.local',
        GIT_COMMITTER_NAME: 'CraftOS AutoCommit',
        GIT_COMMITTER_EMAIL: 'craftos@antigravity.local'
      }
    }).trim();
  } catch (err) {
    // Return empty or throw if critical
    return null;
  }
}

/**
 * Initializes Git repository for a server if not present
 */
export function initServerGit(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) return false;

  const gitDir = path.join(serverDir, '.git');
  if (!fs.existsSync(gitDir)) {
    runGit(serverDir, ['init']);
    
    // Create standard .gitignore for Minecraft server to keep repo lightweight
    const gitignorePath = path.join(serverDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const defaultIgnore = [
        '# Large binary and runtime files',
        'logs/',
        'crash-reports/',
        'cache/',
        '.fabric/',
        'libraries/',
        'backups/',
        '*.log.gz',
        '*.log',
        'session.lock',
        '# World data can be large, but keep level.dat',
        'world/region/',
        'world/entities/',
        'world/poi/',
        'world_nether/region/',
        'world_the_end/region/',
        '*.tmp'
      ].join('\n');
      fs.writeFileSync(gitignorePath, defaultIgnore, 'utf8');
    }

    commitServerChange(serverId, 'Initial server setup by CraftOS', 'init');
    return true;
  }
  return true;
}

/**
 * Automatically commits current state of the server with a descriptive message
 */
export function commitServerChange(serverId, message, category = 'system') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) return null;

  // Ensure git repo initialized
  initServerGit(serverId);

  try {
    // Add all tracked and untracked files respecting .gitignore
    runGit(serverDir, ['add', '-A']);

    // Check if there are changes to commit
    const status = runGit(serverDir, ['status', '--porcelain']);
    if (!status || status.trim().length === 0) {
      // Nothing changed
      return null;
    }

    const timestamp = new Date().toISOString();
    const fullMessage = `[${category.toUpperCase()}] ${message} (${timestamp})`;
    
    runGit(serverDir, ['commit', '-m', fullMessage]);

    // Return the latest commit hash
    const hash = runGit(serverDir, ['rev-parse', '--short', 'HEAD']);
    return {
      hash: hash || 'latest',
      message: fullMessage,
      timestamp,
      category
    };
  } catch (err) {
    console.warn(`[GitManager] Failed to commit for server ${serverId}:`, err.message);
    return null;
  }
}

/**
 * Returns commit history for a server
 */
export function getServerGitHistory(serverId, limit = 50) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) return [];

  const gitDir = path.join(serverDir, '.git');
  if (!fs.existsSync(gitDir)) return [];

  try {
    // Format: Hash|Author|Date|Subject
    const logOutput = runGit(serverDir, [
      'log',
      `-${limit}`,
      '--pretty=format:%h|%an|%ad|%s',
      '--date=iso'
    ]);

    if (!logOutput) return [];

    const lines = logOutput.split('\n');
    const commits = lines.map(line => {
      const [hash, author, date, subject] = line.split('|');
      
      let category = 'system';
      let cleanSubject = subject || '';
      const match = cleanSubject.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        category = match[1].toLowerCase();
        cleanSubject = match[2];
      }

      return {
        hash,
        author,
        date,
        subject: cleanSubject,
        rawSubject: subject,
        category
      };
    });

    return commits;
  } catch (err) {
    console.error(`[GitManager] Error reading git history for ${serverId}:`, err.message);
    return [];
  }
}

/**
 * Reverts server configuration to a specific commit
 */
export function rollbackServerToCommit(serverId, commitHash) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server directory for ${serverId} not found`);
  }

  try {
    // Make sure current changes are committed before rollback
    commitServerChange(serverId, 'Pre-rollback auto-snapshot', 'snapshot');

    // Checkout the specific commit files
    runGit(serverDir, ['checkout', commitHash, '--', '.']);
    
    // Commit the restore state
    commitServerChange(serverId, `Rolled back to state ${commitHash}`, 'rollback');

    return {
      success: true,
      restoredCommit: commitHash,
      message: `Successfully restored server configuration to ${commitHash}`
    };
  } catch (err) {
    throw new Error(`Rollback failed: ${err.message}`);
  }
}
