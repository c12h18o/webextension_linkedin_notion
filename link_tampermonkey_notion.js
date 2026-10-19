// ==UserScript==
// @name         test API Notion
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Link Notion to Tampermonkey
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

"use strict";
console.log("Le fichier local est bien connecté !");

function verifConnexion() {
  return "Connexion OK";
}

console.log("🚀 test API Notionscript loaded !");
function retrieveApiKey() {
  let NOTION_API_KEY = GM_getValue("NOTION_API_KEY", null);

  if (!NOTION_API_KEY) {
    NOTION_API_KEY = prompt("Enter you NOTION_API_KEY :");
    if (NOTION_API_KEY) {
      GM_setValue("NOTION_API_KEY", NOTION_API_KEY.trim());
      alert("Key loaded successfully");
      return NOTION_API_KEY;
    } else {
      console.error("❌ No api KEY provided, the script won't run");
      return;
    }
  }
  return NOTION_API_KEY;
}
retrieveApiKey();

function testNotionConnection() {
  const NOTION_API_KEY = retrieveApiKey();

  if (!NOTION_API_KEY) {
    alert("❌ Aucun jeton Notion fourni.");
    return;
  }

  GM_xmlhttpRequest({
    method: "GET",
    url: "https://api.notion.com/v1/users/me",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      Accept: "application/json",
    },

    onload: function (response) {
      console.log("Réponse Notion :", response.status, response.responseText);

      if (response.status === 200) {
        const data = JSON.parse(response.responseText);
        alert(
          "✅ Connexion à Notion réussie !\n" +
            "Intégration : " +
            (data.name || "Nom non disponible") +
            "\nLe jeton est valide.",
        );
      } else {
        alert(
          "❌ Échec de connexion à Notion.\n" +
            "Code HTTP : " +
            response.status +
            "\nConsulte la console pour le détail.",
        );
      }
    },

    onerror: function (error) {
      console.error("Erreur réseau :", error);
      alert("❌ Erreur réseau lors de la connexion à Notion.");
    },
  });
}

//testNotionConnection();

function testNotionDatabase() {
  const apiKey = retrieveApiKey();
  if (!apiKey) return;

  GM_xmlhttpRequest({
    method: "POST",
    url: "https://api.notion.com/v1/search",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      filter: {
        property: "object",
        value: "data_source",
      },
      page_size: 100,
    }),
    onload: function (response) {
      console.log("Notion HTTP :", response.status);
      console.log("Réponse :", response.responseText);

      if (response.status === 200) {
        const data = JSON.parse(response.responseText);
        const sources = data.results || [];

        console.table(
          sources.map((source) => ({
            nom: (source.title || []).map((t) => t.plain_text || "").join(""),
            id: source.id,
            database_id: source.parent?.database_id || "",
          })),
        );

        alert(
          `✅ Recherche réussie : ${sources.length} source(s) trouvée(s).\n` +
            "Ouvre la console du navigateur pour voir les résultats.",
        );
      } else {
        alert("❌ Erreur HTTP " + response.status + ". Consulte la console.");
      }
    },
    onerror: function (error) {
      console.error(error);
      alert("❌ Erreur réseau.");
    },
  });
}

//testNotionDatabase();

function inspectNotionTable() {
  const apiKey = retrieveApiKey();
  if (!apiKey) return;

  const dataSourceId = "3fb1d9a3-ceae-806f-849a-000bc2002234";

  GM_xmlhttpRequest({
    method: "GET",
    url: `https://api.notion.com/v1/data_sources/${dataSourceId}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2025-09-03",
      Accept: "application/json",
    },
    onload: function (response) {
      console.log("HTTP :", response.status);
      console.log("Réponse complète :", response.responseText);

      if (response.status === 200) {
        const data = JSON.parse(response.responseText);

        console.table(
          Object.entries(data.properties || {}).map(([nom, prop]) => ({
            colonne: nom,
            type: prop.type,
          })),
        );

        alert("✅ Colonnes récupérées ! Consulte la console.");
      } else {
        alert("❌ Erreur HTTP " + response.status + ". Consulte la console.");
      }
    },
    onerror: function (error) {
      console.error(error);
      alert("❌ Erreur réseau.");
    },
  });
}

//inspectNotionTable();

async function logNotionTable() {
  const apiKey = retrieveApiKey();
  if (!apiKey) return;

  const dataSourceId = "3fb1d9a3-ceae-806f-849a-000bc2002234";
  const baseUrl = `https://api.notion.com/v1/data_sources/${dataSourceId}/query`;

  function getText(items) {
    return (items || []).map((item) => item.plain_text || "").join("");
  }

  function formatProperty(property) {
    if (!property) return null;

    switch (property.type) {
      case "title":
        return getText(property.title);

      case "rich_text":
        return getText(property.rich_text);

      case "number":
        return property.number;

      case "url":
        return property.url;

      case "select":
        return property.select?.name ?? null;

      case "multi_select":
        return (property.multi_select || []).map((option) => option.name);

      case "date":
        return property.date
          ? {
              start: property.date.start,
              end: property.date.end,
            }
          : null;

      case "status":
        return property.status?.name ?? null;

      case "checkbox":
        return property.checkbox;

      case "email":
        return property.email;

      case "phone_number":
        return property.phone_number;

      case "people":
        return (property.people || []).map(
          (person) => person.name || person.id,
        );

      case "created_time":
        return property.created_time;

      case "last_edited_time":
        return property.last_edited_time;

      case "created_by":
        return property.created_by?.name || property.created_by?.id;

      case "last_edited_by":
        return property.last_edited_by?.name || property.last_edited_by?.id;

      case "relation":
        return (property.relation || []).map((item) => item.id);

      case "files":
        return (property.files || []).map((file) => ({
          name: file.name,
          url: file[file.type]?.url || null,
        }));

      case "formula":
        return property.formula;

      case "rollup":
        return property.rollup;

      case "unique_id":
        return property.unique_id;

      default:
        return property[property.type] ?? null;
    }
  }

  let allRows = [];
  let cursor = undefined;

  try {
    do {
      const response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: baseUrl,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": "2025-09-03",
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            page_size: 100,
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(JSON.parse(response.responseText));
            } else {
              reject(
                new Error(`HTTP ${response.status}: ${response.responseText}`),
              );
            }
          },
          onerror: () => reject(new Error("Erreur réseau Notion")),
        });
      });

      for (const page of response.results || []) {
        const row = {
          "ID Notion": page.id,
          "URL de la page": page.url,
          Archivée: page.archived,
          "Créée le": page.created_time,
          "Modifiée le": page.last_edited_time,
        };

        for (const [name, property] of Object.entries(page.properties || {})) {
          row[name] = formatProperty(property);
        }

        allRows.push(row);
      }

      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    console.log(`✅ ${allRows.length} ligne(s) récupérée(s) depuis Notion.`);
    console.log("Données complètes :", allRows);
    console.table(allRows);

    // Pour inspecter une ligne en détail :
    if (allRows.length > 0) {
      console.log("Première ligne détaillée :", allRows[0]);
    }

    return allRows;
  } catch (error) {
    console.error("❌ Impossible de lire la base Notion :", error);
    return [];
  }
}

// Lancer la lecture :
//logNotionTable();

function createNotionTestRow(button = null) {
  const apiKey = retrieveApiKey();
  if (!apiKey) return;

  const dataSourceId = "3fb1d9a3-ceae-806f-849a-000bc2002234";

  const properties = {
    Offre: {
      title: [
        {
          text: {
            content: "TEST API Notion — à supprimer",
          },
        },
      ],
    },
    "URL Linkedin": {
      url: "https://www.linkedin.com/jobs/",
    },
    "Nombre candidats": {
      number: 125,
    },
    Compatibilité: {
      rich_text: [
        {
          text: {
            content: "Test technique : connexion Tampermonkey → Notion",
          },
        },
      ],
    },
    Statut: {
      multi_select: [{ name: "Retenue" }],
    },
    "Date de collecte": {
      date: {
        start: new Date().toISOString().slice(0, 10),
      },
    },
  };

  GM_xmlhttpRequest({
    method: "POST",
    url: "https://api.notion.com/v1/pages",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      parent: {
        type: "data_source_id",
        data_source_id: dataSourceId,
      },
      properties: properties,
    }),
    onload: function (response) {
      if (button) {
        button.disabled = false;
        button.textContent = "Créer une ligne test dans Notion";
      }
      console.log("HTTP :", response.status);
      console.log("Réponse Notion :", response.responseText);

      if (response.status === 200) {
        const page = JSON.parse(response.responseText);

        alert("✅ Ligne de test créée dans Notion !\n" + "ID : " + page.id);
      } else {
        console.error("Échec de création :", response.responseText);
        alert(
          "❌ Échec de création : HTTP " +
            response.status +
            "\nConsulte la console pour le détail.",
        );
      }
    },
    onerror: function (error) {
      if (button) {
        button.disabled = false;
        button.textContent = "Créer une ligne test dans Notion";
      }
      console.error("Erreur réseau :", error);
      alert("❌ Erreur réseau pendant la création.");
    },
  });
}

// Exécuter une seule fois pour le test :
//createNotionTestRow();
const testButton = document.createElement("button");

testButton.textContent = "Créer une ligne test dans Notion";
testButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 12px;
    background: #238636;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
`;

testButton.addEventListener("click", () => {
  if (testButton.disabled) return;

  testButton.disabled = true;
  testButton.textContent = "Création en cours…";
  createNotionTestRow(testButton);
});

document.body.appendChild(testButton);
