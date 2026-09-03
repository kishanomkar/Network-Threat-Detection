import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { List, Plus, RotateCcw, TableProperties, Trash2 } from "lucide-react";
import { parseFeatureValue } from "../utils/format.js";

const makeDictionaryRows = (example = []) =>
  example.map(([key, value]) => ({ key, value }));

const makeListRows = (example = []) =>
  example.map((value) => ({ value }));

const makeRowsFromFeatures = (features = {}) =>
  Object.entries(features).map(([key, value]) => ({ key, value: String(value) }));

const FeatureInput = ({ model, onSubmit, loading }) => {
  const [mode, setMode] = useState("dictionary");

  const defaultValues = useMemo(
    () => ({
      dictionary: makeDictionaryRows(model.dictionaryExample),
      list: makeListRows(model.listExample),
    }),
    [model],
  );

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues, mode: "onChange" });

  const dictionaryFields = useFieldArray({ control, name: "dictionary" });
  const listFields = useFieldArray({ control, name: "list" });

  const resetForm = () => {
    clearErrors();
    reset(defaultValues);
  };

  const loadSample = (sample) => {
    clearErrors();
    setMode("dictionary");
    reset({
      dictionary: makeRowsFromFeatures(sample.features),
      list: makeListRows(Object.values(sample.features).map((value) => String(value))),
    });
  };

  const submitFeatures = (values) => {
    if (mode === "dictionary") {
      const payload = {};
      const seenKeys = new Set();

      for (const [index, row] of values.dictionary.entries()) {
        const key = row.key.trim();
        const value = row.value;

        if (!key) {
          setError(`dictionary.${index}.key`, { message: "Feature name is required" });
          return;
        }
        if (seenKeys.has(key)) {
          setError(`dictionary.${index}.key`, { message: "Duplicate feature name" });
          return;
        }
        if (String(value).trim() === "") {
          setError(`dictionary.${index}.value`, { message: "Value is required" });
          return;
        }

        seenKeys.add(key);
        payload[key] = parseFeatureValue(value);
      }

      onSubmit({ features: payload });
      return;
    }

    const listPayload = [];
    for (const [index, row] of values.list.entries()) {
      if (String(row.value).trim() === "") {
        setError(`list.${index}.value`, { message: "Value is required" });
        return;
      }
      listPayload.push(parseFeatureValue(row.value));
    }

    onSubmit({ features: listPayload });
  };

  return (
    <form onSubmit={handleSubmit(submitFeatures)} className="panel p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Feature Input</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{model.endpoint}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode("dictionary")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "dictionary"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <TableProperties className="h-4 w-4" />
              Dictionary
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "list"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
          {model.sampleData?.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {model.sampleData.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadSample(sample)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                    sample.id === "sample_data_1"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  }`}
                >
                  <span className="block">{sample.label}</span>
                  <span className="mt-0.5 block text-xs font-medium opacity-80">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {mode === "dictionary" &&
          dictionaryFields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <Controller
                  control={control}
                  name={`dictionary.${index}.key`}
                  rules={{ required: "Feature name is required" }}
                  render={({ field: inputField }) => (
                    <input {...inputField} className="input" placeholder="Feature name" />
                  )}
                />
                {errors.dictionary?.[index]?.key && (
                  <p className="mt-1 text-xs text-red-600">{errors.dictionary[index].key.message}</p>
                )}
              </div>
              <div>
                <Controller
                  control={control}
                  name={`dictionary.${index}.value`}
                  rules={{ required: "Value is required" }}
                  render={({ field: inputField }) => (
                    <input {...inputField} className="input" placeholder="Feature value" />
                  )}
                />
                {errors.dictionary?.[index]?.value && (
                  <p className="mt-1 text-xs text-red-600">{errors.dictionary[index].value.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dictionaryFields.remove(index)}
                className="btn-secondary px-3"
                aria-label="Remove feature"
                disabled={dictionaryFields.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

        {mode === "list" &&
          listFields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <Controller
                  control={control}
                  name={`list.${index}.value`}
                  rules={{ required: "Value is required" }}
                  render={({ field: inputField }) => (
                    <input {...inputField} className="input" placeholder={`Feature ${index + 1}`} />
                  )}
                />
                {errors.list?.[index]?.value && (
                  <p className="mt-1 text-xs text-red-600">{errors.list[index].value.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => listFields.remove(index)}
                className="btn-secondary px-3"
                aria-label="Remove value"
                disabled={listFields.fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            mode === "dictionary"
              ? dictionaryFields.append({ key: "", value: "" })
              : listFields.append({ value: "" })
          }
          className="btn-secondary"
        >
          <Plus className="h-4 w-4" />
          Add Feature
        </button>

        <div className="flex gap-3">
          <button type="button" onClick={resetForm} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            Run Prediction
          </button>
        </div>
      </div>
    </form>
  );
};

export default FeatureInput;
