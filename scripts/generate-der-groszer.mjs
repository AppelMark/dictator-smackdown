/**
 * Generate all assets for Der Großer via Replicate API.
 * Run with: node scripts/generate-der-groszer.mjs
 *
 * Estimated API cost: ~$2-4 (25+ image generations)
 */

import fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

// ============================================================
// Config
// ============================================================

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error('ERROR: REPLICATE_API_TOKEN environment variable is required');
  console.error('Set it in .env.local or pass it directly: REPLICATE_API_TOKEN=xxx node scripts/generate-der-groszer.mjs');
  process.exit(1);
}

const OUTPUT_BASE = path.join(process.cwd(), 'public', 'sprites', 'der-groszer');
const PARTS_DIR = path.join(OUTPUT_BASE, 'parts');
const ARENA_DIR = path.join(process.cwd(), 'public', 'arenas', 'der-groszer');
const EFFECTS_DIR = path.join(process.cwd(), 'public', 'sprites', 'effects');

const SDXL_VERSION = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
const REMOVE_BG_VERSION = '95fcc2a26d3899cd6c2691c900571aeaea8de26f6292b8801e174d30dfabe0d2';

// ============================================================
// Prompts
// ============================================================

const BASE_PROMPT =
  'claymation character, MTV Celebrity Deathmatch style, shirtless barrel-chested Russian strongman, ' +
  'enormous grey handlebar mustache, tiny furious squinting eyes, military dark trousers, ' +
  'bear claw necklace, red flushed chubby face, oversized head disproportionate to body, ' +
  'massive clay fists, short stocky legs, bright saturated colors, thick black outline 3px, ' +
  'visible clay texture with fingerprints, stop motion aesthetic, white studio background, ' +
  'full body centered, professional game sprite';

const NEGATIVE_PROMPT =
  'realistic, photographic, blurry, deformed, extra limbs, text, watermark, background, ' +
  'multiple characters, thin, tall, elegant, smooth skin, no outline';

const DAMAGE_STATE_ADDITIONS = {
  0: 'neutral aggressive boxing stance, fists raised, looking directly forward, undamaged face, confident smug expression',
  1: 'same character, left eye swollen and bruised purple, clay bruise on cheek, slight nose displacement, angry expression despite damage, still fighting',
  2: 'same character, nose bent sideways, right ear partially detached hanging loose, clay crack on forehead, one eye swollen shut, determined grimace',
  3: 'same character, large clay dent in cheek, ear barely attached, tooth visible and displaced, deep clay cracks on face, one eye bulging out comically, still aggressive',
  4: 'same character, face completely deformed by clay impacts, hole in cheek showing through, both eyes misaligned, nose completely sideways, barely standing, cross-eyed',
};

const PART_PROMPTS = {
  nose: 'isolated claymation nose, Der Großer style, bulbous red clay nose, thick black outline, white background, no face visible, single object only, funny cartoon style, visible clay texture',
  left_ear: 'isolated claymation ear, Der Großer style, fleshy clay ear with grey mustache hair visible at edge, thick black outline, white background, single object only',
  left_eye: 'isolated claymation eye, Der Großer style, angry squinting eye with thick grey eyebrow, clay texture, thick black outline, white background, single object only, comical expression',
  tooth: 'isolated single claymation tooth, large white clay tooth with slight yellow tint, thick black outline, white background, single object only, funny oversized tooth',
};

const FIST_PROMPT =
  'claymation boxing fist, first person perspective view from below, massive clay fist punching toward viewer, ' +
  'Der Großer skin tone, thick black outline, white background, no arm visible, only fist and knuckles, ' +
  'dynamic foreshortening, MTV Deathmatch style';

const ARENA_PROMPTS = {
  background: {
    prompt: 'Red Square Moscow at night, Kremlin towers glowing red, Soviet red stars, heavy snow falling, dramatic dark blue sky, no people, claymation painted style, MTV Celebrity Deathmatch aesthetic, vivid saturated colors, cartoon illustration',
    width: 1536,
    height: 512,
  },
  crowd: {
    prompt: 'crowd of claymation Soviet soldiers and citizens cheering, uniform red clothing, arms raised, excited faces, no background visible, cut out style, thick outlines, bright colors, bottom half of image is transparent area',
    width: 1536,
    height: 384,
  },
  floor: {
    prompt: 'Red Square cobblestone floor, first person perspective, stone tiles receding into distance, central vanishing point, claymation painted style, red and grey tones',
    width: 1536,
    height: 256,
  },
};

const EFFECT_PROMPTS = {
  clay_splat: 'claymation clay splat explosion, red clay splatter isolated on white background, comic book style, thick outlines, bright red, no background',
  impact_stars: 'cartoon impact stars burst, yellow and white, thick black outline, isolated on white, comic book pow effect',
  clay_chunks: 'small claymation clay chunks flying, mixed colors, isolated on white, cartoon style',
};

// ============================================================
// Helpers
// ============================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let apiCallCount = 0;

async function replicatePredict(version, input) {
  apiCallCount++;
  console.log(`  [API call #${apiCallCount}] Starting prediction...`);

  try {
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version, input }),
    });

    const createData = await createRes.json();
    const predictionId = createData.id;

    if (!predictionId) {
      throw new Error(`Failed to create prediction: ${JSON.stringify(createData)}`);
    }

    // Poll until complete
    let prediction = createData;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await sleep(3000);
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      });
      prediction = await pollRes.json();
      process.stdout.write('.');
    }
    console.log(` ${prediction.status}`);

    if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    const output = prediction.output;
    if (Array.isArray(output) && output.length > 0) return output[0];
    if (typeof output === 'string') return output;
    throw new Error(`Unexpected output format: ${JSON.stringify(output)}`);
  } catch (err) {
    console.error(`  API error: ${err.message}`);
    throw err;
  }
}

async function downloadFile(url, outputPath) {
  try {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (err) {
    console.error(`  Download error for ${outputPath}: ${err.message}`);
    throw err;
  }
}

async function removeBackground(inputUrl, outputPath) {
  const resultUrl = await replicatePredict(REMOVE_BG_VERSION, { image: inputUrl });
  await downloadFile(resultUrl, outputPath);
}

// ============================================================
// Generation functions
// ============================================================

async function generateSDXL(prompt, outputPath, width = 768, height = 1024) {
  console.log(`\n  Generating: ${path.basename(outputPath)}`);

  try {
    const resultUrl = await replicatePredict(SDXL_VERSION, {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      width,
      height,
      num_inference_steps: 50,
      guidance_scale: 9,
      scheduler: 'DPMSolverMultistep',
    });

    await downloadFile(resultUrl, outputPath);
    const stat = statSync(outputPath);
    console.log(`  Saved: ${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`);
    return resultUrl;
  } catch (err) {
    console.error(`  Generation failed for ${outputPath}: ${err.message}`);
    throw err;
  }
}

async function generateImg2Img(prompt, imageUrl, outputPath, promptStrength = 0.55) {
  console.log(`\n  Generating (img2img): ${path.basename(outputPath)}`);

  try {
    const resultUrl = await replicatePredict(SDXL_VERSION, {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      image: imageUrl,
      prompt_strength: promptStrength,
      width: 768,
      height: 1024,
      num_inference_steps: 50,
      guidance_scale: 9,
      scheduler: 'DPMSolverMultistep',
    });

    await downloadFile(resultUrl, outputPath);
    const stat = statSync(outputPath);
    console.log(`  Saved: ${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`);
    return resultUrl;
  } catch (err) {
    console.error(`  img2img failed for ${outputPath}: ${err.message}`);
    throw err;
  }
}

// ============================================================
// Main pipeline
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Der Großer Asset Generation Pipeline');
  console.log('='.repeat(60));

  // Ensure directories exist
  await fs.mkdir(OUTPUT_BASE, { recursive: true });
  await fs.mkdir(PARTS_DIR, { recursive: true });
  await fs.mkdir(ARENA_DIR, { recursive: true });
  await fs.mkdir(EFFECTS_DIR, { recursive: true });

  // ---- PART 1: Base reference ----
  console.log('\n--- PART 1: Base Character Reference ---');
  const baseRefPath = path.join(OUTPUT_BASE, 'base_reference.png');
  const baseRefUrl = await generateSDXL(BASE_PROMPT, baseRefPath);

  // ---- PART 2: Damage states ----
  console.log('\n--- PART 2: Damage States (5 states) ---');
  for (let state = 0; state < 5; state++) {
    const statePrompt = `${BASE_PROMPT}, ${DAMAGE_STATE_ADDITIONS[state]}`;
    const statePath = path.join(OUTPUT_BASE, `state_${state}.png`);
    await generateImg2Img(statePrompt, baseRefUrl, statePath, 0.55);
  }

  // ---- PART 3: Loose parts ----
  console.log('\n--- PART 3: Loose Face Parts ---');
  for (const [partName, prompt] of Object.entries(PART_PROMPTS)) {
    const rawPath = path.join(PARTS_DIR, `${partName}_raw.png`);
    const finalPath = path.join(PARTS_DIR, `${partName}.png`);

    const rawUrl = await generateSDXL(prompt, rawPath, 256, 256);
    await removeBackground(rawUrl, finalPath);
    console.log(`  Background removed: ${finalPath}`);
  }

  // Right ear = flipped left ear
  const rightEarNote = path.join(PARTS_DIR, 'right_ear.txt');
  await fs.writeFile(rightEarNote, 'Mirror of left_ear.png — flip horizontally via sharp at build time');
  console.log('  Right ear: will be mirrored from left_ear at build time');

  // ---- PART 4: First-person fist sprites ----
  console.log('\n--- PART 4: Fist Sprites ---');
  const leftFistRawPath = path.join(OUTPUT_BASE, 'fist_left_raw.png');
  const leftFistPath = path.join(OUTPUT_BASE, 'fist_left.png');
  const leftFistUrl = await generateSDXL(FIST_PROMPT, leftFistRawPath, 512, 512);
  await removeBackground(leftFistUrl, leftFistPath);

  const rightFistNote = path.join(OUTPUT_BASE, 'fist_right.txt');
  await fs.writeFile(rightFistNote, 'Mirror of fist_left.png — flip horizontally via sharp at build time');
  console.log('  Right fist: will be mirrored from left_fist at build time');

  // ---- PART 5: Arena layers ----
  console.log('\n--- PART 5: Arena (Red Square) ---');
  for (const [layer, cfg] of Object.entries(ARENA_PROMPTS)) {
    const arenaPath = path.join(ARENA_DIR, `${layer}.png`);
    await generateSDXL(cfg.prompt, arenaPath, cfg.width, cfg.height);
  }

  // ---- PART 6: Impact effects ----
  console.log('\n--- PART 6: Impact Effects ---');
  for (const [effectName, prompt] of Object.entries(EFFECT_PROMPTS)) {
    const rawPath = path.join(EFFECTS_DIR, `${effectName}_raw.png`);
    const finalPath = path.join(EFFECTS_DIR, `${effectName}.png`);

    const rawUrl = await generateSDXL(prompt, rawPath, 256, 256);
    await removeBackground(rawUrl, finalPath);
    console.log(`  Background removed: ${finalPath}`);
  }

  // ============================================================
  // Validation
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION');
  console.log('='.repeat(60));

  const expectedFiles = [
    path.join(OUTPUT_BASE, 'base_reference.png'),
    ...Array.from({ length: 5 }, (_, i) => path.join(OUTPUT_BASE, `state_${i}.png`)),
    path.join(PARTS_DIR, 'nose.png'),
    path.join(PARTS_DIR, 'left_ear.png'),
    path.join(PARTS_DIR, 'left_eye.png'),
    path.join(PARTS_DIR, 'tooth.png'),
    path.join(OUTPUT_BASE, 'fist_left.png'),
    path.join(ARENA_DIR, 'background.png'),
    path.join(ARENA_DIR, 'crowd.png'),
    path.join(ARENA_DIR, 'floor.png'),
    path.join(EFFECTS_DIR, 'clay_splat.png'),
    path.join(EFFECTS_DIR, 'impact_stars.png'),
    path.join(EFFECTS_DIR, 'clay_chunks.png'),
  ];

  let allPresent = true;
  let totalSize = 0;

  for (const file of expectedFiles) {
    if (existsSync(file)) {
      const size = statSync(file).size;
      totalSize += size;
      console.log(`  ✓ ${path.relative(process.cwd(), file)} (${(size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`  ✗ MISSING: ${path.relative(process.cwd(), file)}`);
      allPresent = false;
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total files: ${expectedFiles.length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`API calls made: ${apiCallCount}`);
  console.log(`Estimated cost: $${(apiCallCount * 0.11).toFixed(2)} (SDXL ~$0.11/run)`);
  console.log(`Status: ${allPresent ? 'ALL FILES PRESENT ✓' : 'SOME FILES MISSING ✗'}`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
