import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";

export interface ContentCreationResult {
  success: boolean;
  type: "page" | "blog" | "menu";
  id?: string;
  slug?: string;
  title?: string;
  message: string;
  viewUrl?: string;
  editUrl?: string;
}

// Generate a slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

// Parse AI response for page/blog content
function parseContentFromAI(aiResponse: string, type: "page" | "blog"): {
  title: string;
  content: string;
  metaDescription?: string;
  excerpt?: string;
} {
  const lines = aiResponse.split("\n");
  let title = "";
  let content = "";
  let metaDescription = "";
  let excerpt = "";

  // Try to extract title from common patterns
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      title = trimmed.replace(/^#\s*/, "").trim();
      break;
    }
    if (trimmed.toLowerCase().startsWith("title:")) {
      title = trimmed.replace(/^title:\s*/i, "").trim();
      break;
    }
    if (trimmed.toLowerCase().startsWith("page name:")) {
      title = trimmed.replace(/^page name:\s*/i, "").trim();
      break;
    }
  }

  // If no title found, use first non-empty line
  if (!title) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("```")) {
        title = trimmed.substring(0, 100);
        break;
      }
    }
  }

  // Extract meta description if present
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("meta description:") || trimmed.toLowerCase().startsWith("description:")) {
      metaDescription = trimmed.replace(/^(meta )?description:\s*/i, "").trim();
    }
    if (trimmed.toLowerCase().startsWith("excerpt:") || trimmed.toLowerCase().startsWith("summary:")) {
      excerpt = trimmed.replace(/^(excerpt|summary):\s*/i, "").trim();
    }
  }

  // Content is the full response (will be displayed as-is)
  content = aiResponse;

  // Generate excerpt from first paragraph if not found
  if (!excerpt && type === "blog") {
    const paragraphs = aiResponse.split("\n\n").filter(p => 
      p.trim() && !p.trim().startsWith("#") && !p.trim().startsWith("```")
    );
    if (paragraphs.length > 0) {
      excerpt = paragraphs[0].substring(0, 250);
    }
  }

  return { title: title || "Untitled", content, metaDescription, excerpt };
}

// Create a page in the database
export async function createPageFromAI(aiResponse: string): Promise<ContentCreationResult> {
  try {
    const parsed = parseContentFromAI(aiResponse, "page");
    const slug = generateSlug(parsed.title);

    // Insert into pages table
    const { data, error } = await appClient
      .from("pages")
      .insert({
        title: parsed.title,
        slug: slug,
        content: parsed.content,
        is_published: true,
        template: "default",
        meta_title: parsed.title,
        meta_description: parsed.metaDescription || `${parsed.title} - Dragon Fruit SA`,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add to header menu
    await addPageToMenu(slug, parsed.title);

    return {
      success: true,
      type: "page",
      id: data.id,
      slug: data.slug,
      title: data.title,
      message: `Page "${data.title}" created and added to navigation!`,
      viewUrl: `/page/${data.slug}`,
      editUrl: `/admin/pages`,
    };
  } catch (error: any) {
    console.error("Create page error:", error);
    return {
      success: false,
      type: "page",
      message: error.message || "Failed to create page",
    };
  }
}

// Create a blog post in the database
export async function createBlogFromAI(aiResponse: string): Promise<ContentCreationResult> {
  try {
    const parsed = parseContentFromAI(aiResponse, "blog");
    const slug = generateSlug(parsed.title);

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = parsed.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Insert into blog_posts table
    const { data, error } = await appClient
      .from("blog_posts")
      .insert({
        title: parsed.title,
        slug: slug,
        content: parsed.content,
        excerpt: parsed.excerpt || parsed.content.substring(0, 250),
        is_published: true,
        published_at: new Date().toISOString(),
        author_name: "DFSA Team",
        category: "general",
        read_time_minutes: readTime,
        meta_title: parsed.title,
        meta_description: parsed.metaDescription || parsed.excerpt || `${parsed.title} - Dragon Fruit SA Blog`,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      type: "blog",
      id: data.id,
      slug: data.slug,
      title: data.title,
      message: `Blog post "${data.title}" published!`,
      viewUrl: `/blog/${data.slug}`,
      editUrl: `/admin/blog-posts`,
    };
  } catch (error: any) {
    console.error("Create blog error:", error);
    return {
      success: false,
      type: "blog",
      message: error.message || "Failed to create blog post",
    };
  }
}

// Add page to header menu
async function addPageToMenu(slug: string, title: string): Promise<void> {
  try {
    // Get existing header menu
    const { data: menus } = await appClient
      .from("menus")
      .select("*")
      .eq("location", "header")
      .single();

    if (menus) {
      // Parse existing items
      const items = Array.isArray(menus.items) ? menus.items : [];
      
      // Check if already exists
      const exists = items.some((item: any) => item.url === `/page/${slug}`);
      if (!exists) {
        // Add new item
        items.push({
          label: title,
          url: `/page/${slug}`,
          order: items.length,
        });

        // Update menu
        await appClient
          .from("menus")
          .update({ items })
          .eq("id", menus.id);
      }
    } else {
      // Create header menu if doesn't exist
      await appClient.from("menus").insert({
        name: "Main Navigation",
        location: "header",
        is_active: true,
        items: [
          { label: title, url: `/page/${slug}`, order: 0 },
        ],
      });
    }
  } catch (error) {
    console.error("Failed to add page to menu:", error);
    // Don't throw - page was still created successfully
  }
}

// Add menu item
export async function createMenuItemFromAI(aiResponse: string): Promise<ContentCreationResult> {
  try {
    // Parse menu item from AI response
    const lines = aiResponse.split("\n");
    let label = "";
    let url = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith("label:") || trimmed.toLowerCase().startsWith("menu label:")) {
        label = trimmed.replace(/^(menu )?label:\s*/i, "").trim();
      }
      if (trimmed.toLowerCase().startsWith("url:") || trimmed.toLowerCase().startsWith("link:") || trimmed.toLowerCase().startsWith("link to:")) {
        url = trimmed.replace(/^(link( to)?|url):\s*/i, "").trim();
      }
    }

    if (!label) {
      // Try to get first non-empty meaningful line
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.length < 50 && !trimmed.includes(":")) {
          label = trimmed;
          break;
        }
      }
    }

    if (!label) {
      return {
        success: false,
        type: "menu",
        message: "Could not parse menu label from AI response. Please include 'Label: Your Label' in the prompt.",
      };
    }

    // Default URL if not specified
    if (!url) {
      url = `/${generateSlug(label)}`;
    }

    // Add to header menu
    await addPageToMenu(url.replace(/^\/page\//, ""), label);

    return {
      success: true,
      type: "menu",
      title: label,
      message: `Menu item "${label}" added to navigation!`,
      editUrl: `/admin/menus`,
    };
  } catch (error: any) {
    console.error("Create menu item error:", error);
    return {
      success: false,
      type: "menu",
      message: error.message || "Failed to add menu item",
    };
  }
}
