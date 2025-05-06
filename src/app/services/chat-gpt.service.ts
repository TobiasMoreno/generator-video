import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService {
  private apiKey = 'TU_OPENAI_KEY'; // Reemplaza con tu clave de API de OpenAI
  
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente que genera frases inspiradoras y motivacionales. Responde con frases cortas y concisas.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error en ChatGPT:', error);
      throw error;
    }
  }
}
