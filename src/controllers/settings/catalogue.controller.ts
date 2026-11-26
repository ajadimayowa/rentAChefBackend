import { Request, Response } from "express";
import { Model, Types } from "mongoose";
import { ICatalogueItem } from "../../models/SettingsCatalogue";

/** Multipart forms send booleans as strings. */
const toBool = (value: unknown): boolean | undefined =>
  value === true || value === "true" ? true : value === false || value === "false" ? false : undefined;

/**
 * CRUD handlers for a Settings list (event types, protein options). `label` is
 * used in messages, e.g. "event type". With `imageField`, an uploaded file
 * (req.file, multer-s3) is stored in that field, and sending it empty removes the picture.
 */
export const catalogueHandlers = (
  model: Model<ICatalogueItem>,
  label: string,
  { imageField }: { imageField?: "proteinImage" } = {}
) => {
  const Label = label.charAt(0).toUpperCase() + label.slice(1);

  const parse = (req: Request, partial: boolean): { fields: Partial<ICatalogueItem> } | { error: string } => {
    const body: any = req.body ?? {};
    const fields: Partial<ICatalogueItem> = {};
    if (imageField) {
      const file = req.file as any;
      if (file) fields[imageField] = file.location || file.path;
      else if (body[imageField] === "" || body[imageField] === null) fields[imageField] = null;
    }
    if (body.name !== undefined || !partial) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return { error: "name is required" };
      if (name.length > 80) return { error: "name must be 80 characters or fewer" };
      fields.name = name;
    }
    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (description.length > 300) return { error: "description must be 300 characters or fewer" };
      fields.description = description;
    }
    if (body.isActive !== undefined) {
      const isActive = toBool(body.isActive);
      if (isActive === undefined) return { error: "isActive must be true or false" };
      fields.isActive = isActive;
    }
    return { fields };
  };

  const duplicate = (error: any) => error?.code === 11000;

  return {
    /** Public: active entries, A–Z (for the app). */
    listActive: async (_req: Request, res: Response): Promise<any> => {
      try {
        const items = await model.find({ isActive: true }).collation({ locale: "en" }).sort({ name: 1 });
        return res.status(200).json({ success: true, payload: items });
      } catch (error) {
        console.error(`list ${label} error:`, error);
        return res.status(500).json({ success: false, message: `Could not load ${label}s` });
      }
    },

    /** Admin: everything, newest first. */
    listAll: async (_req: Request, res: Response): Promise<any> => {
      try {
        const items = await model.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, payload: items });
      } catch (error) {
        console.error(`list all ${label} error:`, error);
        return res.status(500).json({ success: false, message: `Could not load ${label}s` });
      }
    },

    create: async (req: Request, res: Response): Promise<any> => {
      try {
        const parsed = parse(req, false);
        if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });
        const item = await model.create(parsed.fields);
        return res.status(201).json({ success: true, payload: item });
      } catch (error) {
        if (duplicate(error)) return res.status(409).json({ success: false, message: `${Label} already exists` });
        console.error(`create ${label} error:`, error);
        return res.status(500).json({ success: false, message: `Could not create the ${label}` });
      }
    },

    update: async (req: Request, res: Response): Promise<any> => {
      try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: `Invalid ${label} id` });
        const parsed = parse(req, true);
        if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });
        const item = await model.findByIdAndUpdate(id, parsed.fields, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ success: false, message: `${Label} not found` });
        return res.status(200).json({ success: true, payload: item });
      } catch (error) {
        if (duplicate(error)) return res.status(409).json({ success: false, message: `${Label} already exists` });
        console.error(`update ${label} error:`, error);
        return res.status(500).json({ success: false, message: `Could not update the ${label}` });
      }
    },

    remove: async (req: Request, res: Response): Promise<any> => {
      try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: `Invalid ${label} id` });
        const deleted = await model.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: `${Label} not found` });
        return res.status(200).json({ success: true, message: `${Label} deleted` });
      } catch (error) {
        console.error(`delete ${label} error:`, error);
        return res.status(500).json({ success: false, message: `Could not delete the ${label}` });
      }
    },
  };
};
