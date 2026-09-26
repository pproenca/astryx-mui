/** @input Optional external dependency directory. @output Temporary tool dependencies. @position Migration-only runtime. */
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function dependency(name) {
  const require = createRequire(
    process.env.M3_DEPS
      ? path.join(process.env.M3_DEPS, 'migration-loader.cjs')
      : import.meta.url,
  );
  try {
    return await import(pathToFileURL(require.resolve(name)).href);
  } catch (error) {
    throw new Error(
      `Cannot load ${name}. Set M3_DEPS to the migration tooling node_modules directory. ${error.message}`,
    );
  }
}
