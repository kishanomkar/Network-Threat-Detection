# Generated Network-State Artifacts

This directory is the default destination for new Person 1 outputs. Each run creates timestamped state and graph JSONL files plus a manifest; no legacy dataset or model file is changed.

The intended hand-off is:

```text
network_states/*.network_states.jsonl  -> Person 2 temporal model input
network_states/*.graph_states.jsonl    -> optional Person 2 graph-model input
```

For one labelled capture, use `data_pipeline.cli --chronological-splits`. It
writes contiguous timestamp-ordered train, validation and test files together,
plus a preprocessor fitted only on training states. Do not recombine or shuffle
those files before Person 2 creates forecast targets.
