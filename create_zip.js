import fs from "fs";
import path from "path";
import archiver from "archiver";

const rootDir = process.cwd();
const zipPath = path.join(rootDir, "society-maintenance-tracker.zip");

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`\n======================================================`);
  console.log(` SUCCESS: Deliverable ZIP archive generated!`);
  console.log(` Output: ${zipPath}`);
  console.log(` Size:   ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log(`======================================================\n`);
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

function walkAndAdd(dir, relativePath = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".git" ||
      entry.name.endsWith(".zip") ||
      entry.name === "dev.db" ||
      entry.name === "dev.db-journal"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      walkAndAdd(fullPath, relPath);
    } else {
      archive.file(fullPath, { name: relPath.replace(/\\/g, "/") });
    }
  }
}

walkAndAdd(rootDir);
archive.finalize();
