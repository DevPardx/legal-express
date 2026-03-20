import Handlebars from "handlebars";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { TemplateData } from "@/types/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "../templates");

Handlebars.registerHelper("formatDate", (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
});

Handlebars.registerHelper("uppercase", (str: string) => str?.toUpperCase() ?? "");

Handlebars.registerHelper("ifEqual", function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
});

// Cache compiled templates
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export class TemplateService {
    async render(templateName: string, data: TemplateData) {
        let template = templateCache.get(templateName);

        if (!template) {
            const templatePath = join(TEMPLATES_DIR, `${templateName}.hbs`);
            const source = await readFile(templatePath, "utf-8");
            template = Handlebars.compile(source);
            templateCache.set(templateName, template);
        }

        return template(data);
    }

    clearCache() {
        templateCache.clear();
    }
}

export const templateService = new TemplateService();