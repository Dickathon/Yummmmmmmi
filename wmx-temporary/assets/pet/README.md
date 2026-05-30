# Pet Layer Generation

This directory stores source references, guide layers, generation kits, and final outputs for pet dress-up components.

## Layout

- `reference/`: source images copied into the workspace for a specific generation run.
- `components/`: local guide layers used to anchor mask placement and adjacency boxes.
- `generation-kits/`: prepared prompts, masks, previews, manifests, and generated outputs for each run.

## Workflow

1. Prepare a generation kit:

```powershell
python tools/prepare_pet_generation.py `
  C:\path\to\reference.png `
  --pet-name cat `
  --guide-dir assets\pet\components `
  --output-dir assets\pet\generation-kits\cat-torso-first
```

2. Review the generated prompts, masks, and adjacency previews in `assets/pet/generation-kits/cat-torso-first`.

3. Dry-run the GPT Image CLI calls:

```powershell
python tools/run_pet_generation.py `
  assets\pet\generation-kits\cat-torso-first\manifest.json `
  --dry-run
```

4. Run the actual generation after `OPENAI_API_KEY` is available:

```powershell
python tools/run_pet_generation.py `
  assets\pet\generation-kits\cat-torso-first\manifest.json `
  --force
```
