from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import textwrap

router = APIRouter()


class ChatRequest(BaseModel):
  message: str


class ChatResponse(BaseModel):
  reply: str
  ideas: List[Dict[str, Any]]


# Simple in-memory knowledge base about recycling / upcycling plastic and unused items
KNOWLEDGE_BASE: List[Dict[str, Any]] = [
  {
    "id": 1,
    "title": "Self-Watering Planter from Plastic Bottle",
    "materials": ["2L plastic bottle", "cotton rope", "potting soil", "plant"],
    "category": "plastic_bottle",
    "difficulty": "easy",
    "summary": "Turn a plastic bottle into a self-watering planter for small herbs.",
    "steps": [
      "Cut the plastic bottle roughly in the middle.",
      "Make a small hole in the cap and insert a cotton rope as a wick.",
      "Fill the top part with soil and plant, and add water to the bottom part.",
      "Place the top part upside down into the bottom half so the wick touches the water."
    ]
  },
  {
    "id": 2,
    "title": "Desk Organizer from Cardboard Box",
    "materials": ["shoe box", "toilet paper rolls", "glue", "paint or wrapping paper"],
    "category": "cardboard",
    "difficulty": "easy",
    "summary": "Reuse a shoe box and rolls to organize pens, markers and small items.",
    "steps": [
      "Cut the shoe box lid and base to desired height.",
      "Glue toilet paper rolls vertically inside to create compartments.",
      "Cover the outside with paint or wrapping paper for a clean look.",
      "Use sections for pens, clips, notes, and other stationery."
    ]
  },
  {
    "id": 3,
    "title": "Eco-Friendly Shopping Bag from Old T-Shirt",
    "materials": ["old t-shirt", "scissors", "needle and thread or fabric glue"],
    "category": "textile",
    "difficulty": "medium",
    "summary": "Convert an old t-shirt into a reusable shopping bag without buying new fabric.",
    "steps": [
      "Lay the t-shirt flat and cut off the sleeves and neck to form handles.",
      "Turn the shirt inside out and sew or glue the bottom edge closed.",
      "Optionally cut small slits along the bottom before tying for a fringed style.",
      "Turn it right side out – your upcycled bag is ready."
    ]
  },
  {
    "id": 4,
    "title": "Bird Feeder from Plastic Bottle",
    "materials": ["1–2L plastic bottle", "two wooden spoons or sticks", "string", "bird seed"],
    "category": "plastic_bottle",
    "difficulty": "easy",
    "summary": "Create a simple hanging bird feeder from a plastic bottle.",
    "steps": [
      "Clean and dry the bottle.",
      "Cut two small holes opposite each other near the bottom and push a spoon or stick through.",
      "Make small openings above the spoons so seeds can spill onto them.",
      "Fill with bird seed, attach string to the top, and hang in a safe spot."
    ]
  },
  {
    "id": 5,
    "title": "Storage Basket from Newspaper or Magazine Rolls",
    "materials": ["old newspapers or magazines", "glue", "cardboard base", "paint (optional)"],
    "category": "paper",
    "difficulty": "medium",
    "summary": "Roll and weave old newspapers into a sturdy storage basket.",
    "steps": [
      "Roll newspaper pages diagonally into tight tubes and glue the ends.",
      "Create a cardboard base and glue tubes around the edges.",
      "Weave additional tubes in and out to build up the sides.",
      "Trim edges, glue to secure, and paint if desired."
    ]
  },
  {
    "id": 6,
    "title": "Laptop Stand from Cardboard",
    "materials": ["thick cardboard", "cutter", "ruler", "glue or tape"],
    "category": "cardboard",
    "difficulty": "medium",
    "summary": "Make an angled laptop stand to improve airflow using only cardboard.",
    "steps": [
      "Measure your laptop width and cut two identical side pieces with a gentle slope.",
      "Cut cross-support pieces to connect the sides.",
      "Glue or tape the structure firmly and let it dry.",
      "Optionally cover with paper or fabric for a cleaner look."
    ]
  },
  {
    "id": 7,
    "title": "Seedling Trays from Egg Cartons",
    "materials": ["paper egg cartons", "soil", "seeds", "tray or plate"],
    "category": "paper",
    "difficulty": "easy",
    "summary": "Use paper egg cartons as biodegradable seed starters.",
    "steps": [
      "Place the egg carton on a tray to catch water.",
      "Fill each cup with potting soil.",
      "Sow seeds as per packet instructions and water lightly.",
      "When seedlings are strong, cut cups apart and plant directly into the soil."
    ]
  },
  {
    "id": 8,
    "title": "Hanging Garden from Plastic Bottles",
    "materials": ["several plastic bottles", "rope or wire", "soil", "plants"],
    "category": "plastic_bottle",
    "difficulty": "hard",
    "summary": "Create a vertical garden on a wall or balcony using bottles.",
    "steps": [
      "Cut rectangular openings on the side of each bottle.",
      "Make holes on the ends and thread rope or wire through to hang them horizontally.",
      "Fill with soil and plant herbs or small flowering plants.",
      "Mount on a wall or railing ensuring good sunlight and drainage."
    ]
  }
]


def _normalize(text: str) -> List[str]:
  return [w for w in text.lower().replace("/", " ").replace(",", " ").split() if len(w) > 2]


def _score(query: str, idea: Dict[str, Any]) -> int:
  """Very simple keyword overlap scoring between query and idea fields."""
  q_words = set(_normalize(query))
  if not q_words:
    return 0

  fields = [idea["title"], idea["summary"], " ".join(idea["materials"]), " ".join(idea["steps"])]
  text = " ".join(fields)
  i_words = set(_normalize(text))

  return len(q_words & i_words)


@router.post("/query", response_model=ChatResponse)
async def query_chatbot(payload: ChatRequest):
  message = (payload.message or "").strip()
  if not message:
    raise HTTPException(status_code=400, detail="Message cannot be empty")

  # Rank ideas by simple keyword overlap
  scored = [
    (idea, _score(message, idea))
    for idea in KNOWLEDGE_BASE
  ]
  scored = [item for item in scored if item[1] > 0]
  scored.sort(key=lambda x: x[1], reverse=True)

  top_ideas = [item[0] for item in scored[:3]] or KNOWLEDGE_BASE[:2]

  # Build a friendly reply text from the top ideas
  bullet_lines = []
  for idea in top_ideas:
    bullet = f"• {idea['title']} — {idea['summary']}"
    bullet_lines.append(bullet)

  intro = (
    "Here are some upcycling / recycling ideas based on your question. "
    "These projects use common waste items like plastic bottles, cardboard, and old clothes:\n\n"
  )

  reply_text = intro + "\n".join(bullet_lines)

  # Also include full idea details so the frontend can render rich cards if needed
  return ChatResponse(
    reply=textwrap.dedent(reply_text).strip(),
    ideas=top_ideas,
  )
