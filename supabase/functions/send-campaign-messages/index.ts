import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignMessage {
  id: string
  campaign_id: string
  type: string
  content: string
  order_index: number
  file_name?: string
  file_size?: number
  mime_type?: string
}

interface Contact {
  id: string
  campaign_id: string
  nome: string
  numero: string
  tag: string
  status: string
}

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  scheduled_days: string[]
  start_time: string
  end_time: string
  message_interval: number
  start_date?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { campaignId } = await req.json()

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get campaign details with connection info
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        connections:connection_id (
          name,
          instance_api_id
        )
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if campaign should be running now
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' })
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    if (!campaign.scheduled_days.includes(currentDay)) {
      return new Response(
        JSON.stringify({ message: 'Campaign not scheduled for today' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (currentTime < campaign.start_time || currentTime > campaign.end_time) {
      return new Response(
        JSON.stringify({ message: 'Campaign not in active time range' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get pending contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(10) // Process 10 contacts at a time

    if (contactsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch contacts' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending contacts found' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get campaign messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true })

    if (messagesError || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages found for campaign' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process messages for each contact
    const results = []
    
    for (const contact of contacts) {
      try {
        // Process each message for this contact
        for (const message of messages) {
          // Replace variables in message content
          let processedContent = message.content
          processedContent = processedContent.replace(/\{\{nome\}\}/g, contact.nome)
          processedContent = processedContent.replace(/\{\{tag\}\}/g, contact.tag)

          // Enviar mensagem via API real
          const messageResult = await sendWhatsAppMessage({
            to: contact.numero,
            type: message.type,
            content: processedContent,
            fileName: message.file_name,
            mimeType: message.mime_type,
            instanceName: campaign.connections?.name || 'default',
            mediaUrl: message.media_url,
            mediaBase64: message.media_base64,
            caption: message.caption,
            delay: message.delay || campaign.message_interval * 1000 || 3200
          })

          results.push({
            contact_id: contact.id,
            message_id: message.id,
            status: messageResult.success ? 'sent' : 'failed',
            error: messageResult.error || null
          })

          // Wait for the specified interval before next message
          if (campaign.message_interval > 0) {
            await new Promise(resolve => setTimeout(resolve, campaign.message_interval * 1000))
          }
        }

        // Update contact status
        await supabase
          .from('contacts')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', contact.id)

      } catch (error) {
        console.error(`Error processing contact ${contact.id}:`, error)
        
        // Update contact status to failed
        await supabase
          .from('contacts')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', contact.id)

        results.push({
          contact_id: contact.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Update campaign statistics
    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    await supabase
      .from('campaigns')
      .update({
        sent_messages: (campaign.sent_messages || 0) + successCount,
        failed_messages: (campaign.failed_messages || 0) + failedCount
      })
      .eq('id', campaignId)

    return new Response(
      JSON.stringify({ 
        message: 'Campaign messages processed',
        processed: contacts.length,
        sent: successCount,
        failed: failedCount,
        results
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-campaign-messages:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Integração real com API do Grupo Sena
async function sendWhatsAppMessage(params: {
  to: string
  type: string
  content: string
  fileName?: string
  mimeType?: string
  instanceName?: string
  mediaUrl?: string
  mediaBase64?: string
  caption?: string
  delay?: number
}): Promise<{ success: boolean; error?: string }> {
  const API_KEY = '3ac318ab976bc8c75dfe827e865a576c';
  const BASE_URL = 'https://api.gruposena.club';
  
  try {
    let endpoint = '';
    let payload: any = {};
    
    // Determinar endpoint baseado no tipo de mensagem
    if (params.type === 'text') {
      endpoint = `/message/sendText/${params.instanceName || 'default'}`;
      payload = {
        number: params.to,
        textMessage: {
          text: params.content
        },
        delay: params.delay || 3200
      };
    } else {
      // Mensagem de mídia
      endpoint = `/message/sendMedia/${params.instanceName || 'default'}`;
      
      // Mapear tipos para API
      let mediatype = 'document';
      if (params.type === 'image') mediatype = 'image';
      else if (params.type === 'video') mediatype = 'video';
      else if (params.type === 'audio') mediatype = 'audio';
      
      payload = {
        number: params.to,
        mediatype,
        mimetype: params.mimeType || 'application/octet-stream',
        caption: params.caption || params.content || '',
        media: params.mediaBase64 || params.mediaUrl || '',
        fileName: params.fileName || 'file',
        delay: params.delay || 3200,
        linkPreview: true
      };
    }
    
    console.log(`🚀 Enviando ${params.type} para ${params.to}...`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`
      };
    }
    
    const result = await response.json();
    console.log(`✅ Resposta da API:`, result);
    
    // Verificar se a resposta indica sucesso
    if (result.error || result.status === 'error') {
      return {
        success: false,
        error: result.message || result.error || 'Erro desconhecido da API'
      };
    }
    
    console.log(`✅ Mensagem enviada com sucesso para ${params.to}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão'
    };
  }
}

/* 
To deploy this function:
1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref YOUR_PROJECT_REF
4. Deploy: supabase functions deploy send-campaign-messages

Usage:
- Call this function periodically (every 5-10 minutes) via cron job
- Or trigger it manually when starting a campaign
- The function will process pending messages respecting the campaign schedule
*/