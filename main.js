// main.js
import bot from "./assets/bot.svg";
import user from "./assets/user.svg";

const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");

let loadInterval;

function parseMarkdown(text) {
  if (!text) return "";

  // Convert headers first (with proper spacing)
  text = text.replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content.trim()}</h${level}>\n`;
  });

  // Handle code blocks with language support
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || "";
    return `<pre class="code-block ${language}"><code>${code.trim()}</code></pre>\n`;
  });

  // Handle inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Enhanced bold text handling
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

  // Handle italic text
  text = text.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // Detect bullet points but remove the bullet characters, maintaining line breaks
  text = text.replace(/^[•\-*]\s+(.+)$/gm, "<div class='list-item'>$1</div>");

  // Detect numbered list items but remove the numbering, maintaining line breaks
  text = text.replace(/^\d+\.\s+(.+)$/gm, "<div class='list-item'>$1</div>");

  // Handle paragraphs with proper spacing
  text = text
    .split("\n\n")
    .map((para) => {
      para = para.trim();
      if (para === "") return "";
      return para.startsWith("<") ? para : `<p>${para}</p>`;
    })
    .join("\n");

  return text;
}

function loader(element) {
  element.textContent = "";

  loadInterval = setInterval(() => {
    element.textContent += ".";

    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

function typeText(element, text) {
  const parsedText = parseMarkdown(text);
  let index = 0;
  let currentTag = "";
  let isInsideTag = false;

  let interval = setInterval(() => {
    if (index < parsedText.length) {
      const char = parsedText[index];

      // Handle HTML tags
      if (char === "<") {
        isInsideTag = true;
        currentTag += char;
      } else if (char === ">") {
        isInsideTag = false;
        currentTag += char;
        element.innerHTML += currentTag;
        currentTag = "";
      } else if (isInsideTag) {
        currentTag += char;
      } else {
        element.innerHTML += char;
      }

      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId, emotion = null) {
  const emotionIndicator = emotion
    ? `<div class="emotion-indicator emotion-${emotion.toLowerCase()}">${
        emotion[0]
      }</div>`
    : "";

  return `
    <div class="wrapper ${isAi && "ai"}">
      <div class="chat">
        ${emotionIndicator}
        <div class="profile">
          <img 
            src="${isAi ? bot : user}" 
            alt="${isAi ? "bot" : "user"}" 
          />
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get("prompt"), "Negative");

  // clear textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  // focus scroll to the bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div
  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  const response = await fetch(
    "http://localhost:https://intelligent-reverence-production.up.railway.app//api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: data.get("prompt"),
      }),
    }
  );

  clearInterval(loadInterval);
  messageDiv.innerHTML = " ";

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();

    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();

    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
};

form.addEventListener("submit", handleSubmit);
form.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
