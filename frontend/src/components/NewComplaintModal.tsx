import React, { useState } from "react";
import { api } from "../services/api";
import { Complaint } from "../types";
import { X, Upload, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Water Supply",
  "Lift/Elevator",
  "Common Area",
  "Security",
  "Other",
];

interface NewComplaintModalProps {
  onClose: () => void;
  onCreated: (complaint: Complaint) => void;
}

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size exceeds 10MB limit");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !description.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        onCreated(res.data.data.complaint);
      }
    } catch (err: any) {
      console.error("Failed to register complaint:", err);
      setError(err.response?.data?.message || "Failed to submit complaint. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1120]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              File Maintenance Request
            </h2>
            <p className="text-xs text-slate-400">
              Submit your maintenance complaint to the society administrative team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Category <span className="text-amber-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Subject Summary <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bedroom washroom faucet dripping"
              className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Detailed Description <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, location inside flat/corridor, urgency, and any convenient time for the technician..."
              className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-slate-200 p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Attach Photo Evidence (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-800 border-dashed rounded-xl hover:border-slate-700 bg-[#090d16]/70 transition">
              <div className="space-y-1 text-center">
                {photoPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={photoPreview}
                      alt="Upload preview"
                      className="h-28 w-auto object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="text-xs text-rose-400 font-semibold hover:underline"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-slate-500" />
                    <div className="flex text-xs text-slate-400 justify-center">
                      <label className="relative cursor-pointer bg-slate-800 rounded-md font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1 border border-slate-700 mt-1">
                        <span>Select image file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
