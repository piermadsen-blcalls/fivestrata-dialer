# Generate placeholder voice-pack clips with Windows built-in TTS (no keys, no
# admin). These are latency-test stand-ins; the real voice-pack pipeline (W6)
# replaces them with a proper AI voice.
# Run: powershell.exe -ExecutionPolicy Bypass -File scripts\gen-dev-clips.ps1
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints('Female')
$outDir = "C:\Claude\fivestrata-dialer\voice-packs\dev-pack-0"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$clips = [ordered]@{
  "clip1_intro"     = "Hi, this is the Five Strata soundboard test. Clip one is playing from a pre recorded file."
  "clip2_prequeued" = "This is clip two. It was queued while clip one was still playing. If you did not hear a gap between clips, the soundboard thesis holds."
  "clip3_reactive"  = "Clip three was fired reactively through the full webhook loop, for comparison. Goodbye."
}

# 8 kHz 16-bit mono = telephony-native; avoids server-side resample at play time
# (22 kHz clips measured a 560ms pre-queued seam on 8/7 — testing if format is the residue)
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(8000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

foreach ($key in $clips.Keys) {
  $path = Join-Path $outDir "$key.wav"
  $synth.SetOutputToWaveFile($path, $fmt)
  $synth.Speak($clips[$key])
  Write-Output "wrote $path"
}
$synth.SetOutputToNull()
$synth.Dispose()
