const { exec } = require("child_process");
const path = require("path");

// Phase 3: Safety Guardrail - Command Whitelist
// Prevents arbitrary command execution (security risk)
const SCRIPTS_DIR = path.join(__dirname, "../../../scripts");

// Only these commands are allowed to execute
const ALLOWED_COMMANDS = [
  // Service restart
  `bash ${path.join(SCRIPTS_DIR, "restart-service.sh")}`,
  
  // Resource healing
  `bash ${path.join(SCRIPTS_DIR, "kill-process.sh")}`,
  `bash ${path.join(SCRIPTS_DIR, "cleanup-memory.sh")}`,
  `bash ${path.join(SCRIPTS_DIR, "cleanup-disk.sh")}`,
  
  // Systemctl operations (with specific services)
  "systemctl restart nginx",
  "systemctl restart apache2",
  "systemctl restart postgresql",
  "systemctl restart mysql",
  "systemctl restart redis",
  
  // Journal cleanup (safe operation)
  "journalctl --vacuum-time=3d",
  "journalctl --vacuum-size=500M",
];

/**
 * Phase 3: Command whitelist validator
 * Prevents execution of arbitrary commands
 */
function isCommandAllowed(command) {
  // Remove sudo prefix for comparison
  const cleanCommand = command.replace(/^sudo\s+/, "");
  
  // Check if command matches any whitelisted pattern
  return ALLOWED_COMMANDS.some(allowed => {
    // Exact match
    if (cleanCommand === allowed) return true;
    
    // Pattern match for scripts with arguments (e.g., restart-service.sh nginx)
    if (allowed.includes(".sh") && cleanCommand.startsWith(allowed)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Execute shell command with security validation
 * Phase 3: Now includes whitelist check
 */
exports.runCommand = (command) => {
  return new Promise((resolve, reject) => {
    // Phase 3: Validate command against whitelist
    if (!isCommandAllowed(command)) {
      const error = new Error(
        `❌ SECURITY: Command blocked by whitelist: "${command}"`
      );
      error.code = "COMMAND_NOT_ALLOWED";
      console.error(`\n🚨 SECURITY VIOLATION DETECTED`);
      console.error(`   Blocked command: ${command}`);
      console.error(`   Reason: Not in whitelist\n`);
      return reject(error);
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout || stderr);
    });
  });
};

/**
 * Get list of allowed commands (for debugging/auditing)
 */
exports.getAllowedCommands = () => {
  return [...ALLOWED_COMMANDS]; // Return copy
};

/**
 * Check if a command is allowed (for testing)
 */
exports.isCommandAllowed = isCommandAllowed;
