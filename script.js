"use strict";

const form = document.querySelector("#listing-form");
const results = document.querySelector("#results");
const emptyState = results.firstElementChild.cloneNode(true);
let toastTimer;

const charCount = text => Array.from(text).length;

function fit(text, max) {
  if (charCount(text) <= max) return text;

  const shortened = Array.from(text).slice(0, max).join("");
  const boundary = shortened.lastIndexOf(" ");

  return (
    boundary > max * 0.6
      ? shortened.slice(0, boundary)
      : shortened
  ).trim();
}

function makeTags(data) {
  const candidates = [
    data.main,
    data.secondary,
    `${data.event} invite`,
    data.event,
    ...[data.main, data.secondary].flatMap(term =>
      term.split(/\s+/)
        .filter(word => charCount(word) > 3)
        .map(word => `${word} invitation`)
    ),
    "church invitation",
    "christian invite",
    "church event",
    "faith invitation",
    "ministry invitation",
    "church gathering",
    "religious invite",
    "worship invitation",
    "fellowship event",
    "church celebration",
    "event invitation",
    "church stationery",
    "faith gathering",
    "christian event",
    "church welcome"
  ];

  const tags = [];

  for (const candidate of candidates) {
    const cleaned = candidate.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tag = fit(cleaned, 20);

    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length === 13) break;
  }

  return tags;
}

function makeContent(data) {
  const pieces = [
    data.main,
    data.title,
    `${data.event} Invitation`,
    data.secondary,
    data.church
  ];

  let seoTitle = "";

  for (const piece of pieces) {
    if (seoTitle.toLowerCase().includes(piece.toLowerCase())) continue;

    const candidate = seoTitle ? `${seoTitle} | ${piece}` : piece;
    if (charCount(candidate) <= 140) seoTitle = candidate;
  }

  const tags = makeTags(data);

  return [
    {
      title: "Etsy SEO Title",
      text: seoTitle || fit(data.main, 140),
      limit: 140
    },
    {
      title: "Etsy Product Description",
      text:
`${data.title}

Bring faith, fellowship, and a warm welcome to your ${data.event.toLowerCase()} with this church invitation. Help ${data.church} set the tone for a meaningful gathering with an invitation that reflects the care behind the occasion.

ABOUT THE INVITATION
${data.description}

A THOUGHTFUL WAY TO GATHER
Welcome your congregation, invite someone new, and celebrate your community. If you are searching for ${data.main} or ${data.secondary}, explore this invitation for your upcoming church event.

BEFORE YOU ORDER
Please review the listing details for included items, dimensions, format, personalization options, delivery, and usage terms. Contact the seller with questions so you can choose the right invitation for your gathering.

Gather in faith. Celebrate in community. Make everyone feel welcome.`
    },
    {
      title: "13 Etsy Tags",
      text: tags.join(", "),
      tags
    },
    {
      title: "Pinterest Description",
      text:
`Planning a ${data.event.toLowerCase()}? Discover “${data.title},” a ${data.main} for a meaningful gathering at ${data.church}.

${data.description}

Save this ${data.secondary} idea for your next church event and visit the listing for full product details.

#ChurchInvitation #ChurchEvent #FaithAndFellowship`
    },
    {
      title: "Facebook Promotional Post",
      text:
`Every meaningful gathering begins with a warm invitation.

Introducing “${data.title}” — a ${data.main} for a ${data.event.toLowerCase()} at ${data.church}.

${data.description}

Looking for ${data.secondary}? Explore this invitation and help set the tone for a celebration of faith and community. Visit our Etsy shop for the full listing, or message us with questions.

Share this with someone planning their next church event!

#ChurchInvitation #FaithAndCommunity`
    }
  ];
}

function notify(message) {
  const status = document.querySelector("#status");
  status.textContent = message;
  status.classList.add("visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => status.classList.remove("visible"), 4000);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const previous = document.activeElement;
      const area = document.createElement("textarea");

      area.value = text;
      area.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(area);
      area.select();

      const success = document.execCommand("copy");
      area.remove();
      previous?.focus();

      if (!success) throw new Error("Clipboard unavailable");
    }

    notify("Copied to clipboard.");
  } catch {
    notify("Copy unavailable. Select the generated text and copy it manually.");
  }
}

function render(items) {
  results.replaceChildren();

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const heading = document.createElement("div");
    heading.className = "card-heading";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy";
    copy.textContent = "Copy";
    copy.setAttribute("aria-label", `Copy ${item.title}`);
    copy.addEventListener("click", () => copyText(item.text));

    heading.append(title, copy);
    card.append(heading);

    if (item.tags) {
      const list = document.createElement("div");
      list.className = "tags";

      item.tags.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "tag";
        chip.textContent = tag;

        const count = document.createElement("small");
        count.textContent = `${charCount(tag)}/20`;

        chip.append(count);
        list.append(chip);
      });

      card.append(list);
    } else {
      const text = document.createElement("p");
      text.className = "copy-text";
      text.textContent = item.text;
      card.append(text);
    }

    const count = document.createElement("p");
    count.className = "count";
    count.textContent = item.tags
      ? "13 unique tags · 20 characters maximum each"
      : `${charCount(item.text)}${item.limit ? ` / ${item.limit}` : ""} characters`;

    card.append(count);
    results.append(card);
  });
}

function updateCounts() {
  document.querySelectorAll("[data-count]").forEach(counter => {
    const field = document.getElementById(counter.dataset.count);
    counter.textContent = `${charCount(field.value)} / ${field.maxLength}`;
  });
}

form.addEventListener("input", event => {
  event.target.setCustomValidity("");
  updateCounts();
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form));

  for (const key of Object.keys(data)) {
    data[key] = data[key].trim().replace(/\s+/g, " ");

    if (!data[key]) {
      form.elements[key].setCustomValidity("Please enter more than spaces.");
      form.elements[key].reportValidity();
      return;
    }
  }

  render(makeContent(data));
  notify("Your listing and promotional posts are ready.");

  if (window.matchMedia("(max-width: 800px)").matches) {
    document.querySelector(".output-panel")
      .scrollIntoView({ behavior: "auto", block: "start" });
  }
});

document.querySelector("#clear").addEventListener("click", () => {
  form.reset();

  [...form.elements].forEach(field => {
    field.setCustomValidity?.("");
  });

  results.replaceChildren(emptyState.cloneNode(true));
  updateCounts();
  form.elements.title.focus();
  notify("All fields and generated content cleared.");
});

updateCounts();
