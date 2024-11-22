import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { face_image, base_image } = await request.json()
    console.log('Coze API 后端收到请求:', { face_image, base_image })

    const COZE_API_KEY = process.env.COZE_API_KEY
    const COZE_WORKFLOW_ID = process.env.COZE_WORKFLOW_ID

    if (!COZE_API_KEY || !COZE_WORKFLOW_ID) {
      console.error('API 配置缺失')
      return NextResponse.json(
        { success: false, error: 'API configuration missing' },
        { status: 500 }
      )
    }

    const requestBody = {
      workflow_id: COZE_WORKFLOW_ID,
      parameters: {
        face_image,
        base_image
      }
    }
    console.log('发送到 Coze 的请求:', requestBody)

    const response = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    console.log('Coze 返回的原始数据:', data)

    if (data.code !== 0) {
      console.error('Coze API 错误:', data)
      return NextResponse.json(
        { success: false, error: data.msg || 'Coze API error' },
        { status: 500 }
      )
    }

    const resultData = JSON.parse(data.data)
    console.log('解析后的结果数据:', resultData)
    
    return NextResponse.json({
      success: true,
      url: resultData.output
    })

  } catch (error) {
    console.error('Coze API 处理错误:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 