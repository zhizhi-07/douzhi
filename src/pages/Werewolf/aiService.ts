import { callZhizhiApi } from '../../services/zhizhiapi';
import { GameState, AIDiscussionScript } from './types';

/**
 * 核心黑科技：一次API调用生成全场发言
 */
export const generateDayDiscussions = async (
  gameState: GameState,
  deadPlayerIds: string[]
): Promise<AIDiscussionScript> => {
  const { players, day } = gameState;
  const alivePlayers = players.filter(p => p.isAlive);
  const aiPlayers = alivePlayers.filter(p => !p.isUser);
  const user = players.find(p => p.isUser);
  
  // 构建当前局势描述
  const playerStatusDesc = players.map(p => 
    `${p.name}(${p.id}): ${p.isAlive ? '存活' : '已死亡'} [${p.isUser ? '用户' : 'AI'}] ${!p.isUser ? `[真实身份:${p.role}]` : ''}`
  ).join('\n');

  const deadNames = deadPlayerIds.length > 0 
    ? players.filter(p => deadPlayerIds.includes(p.id)).map(p => p.name).join(', ')
    : '无人';

  const systemPrompt = `你是一个狼人杀游戏的上帝和剧本作家。
当前是第 ${day} 天白天。昨晚死亡情况：${deadNames}。

场上玩家信息（括号内为真实身份，请保密）：
${playerStatusDesc}

你的任务是：为所有存活的 AI 玩家生成一轮发言剧本。
玩家 ${user?.name} 是人类用户，不需要你生成发言。

要求：
1. **角色扮演**：每个 AI 必须根据自己的真实身份发言。
   - 狼人(werewolf)：必须伪装成好人，可以悍跳预言家，或者假装平民。如果是狼同伴被怀疑，可以捞一把或者倒钩。
   - 预言家(seer)：应该尽快报查验信息（金水/查杀）。
   - 女巫(witch)：如果有银水（昨晚救的人），可以选择报出来。
   - 平民(villager)：根据场上局势分析，不要开天眼。
2. **逻辑性**：发言要基于当前死人情况。如果昨晚平安夜，大家会开心。如果死人了，大家会推测。
3. **针对性**：可以互相怀疑、辩解。
4. **口语化**：使用狼人杀术语（金水、查杀、悍跳、铁狼、退水、扛推）。
5. **格式**：严格返回 JSON 格式。

JSON 结构示例：
{
  "discussions": [
    { "speakerId": "p2", "content": "昨晚居然平安夜？女巫这就用药了吗？" },
    { "speakerId": "p3", "content": "我是预言家，昨晚验了 p4，是金水，这把稳了。", "targetId": "p4" },
    { "speakerId": "p4", "content": "接个金水。我觉得 p2 语气怪怪的。" }
  ],
  "votes": {
    "p2": "p4",
    "p3": "p4"
  }
}
votes 字段表示每个 AI 心目中想投给谁（可以为空字符串表示弃票）。这个用于辅助前端投票显示。
请确保生成至少每人 1-2 句发言，形成一个完整的讨论流。
`;

  try {
    console.log('--- AI Werewolf Generation Start ---');
    console.log('System Prompt:', systemPrompt);
    console.log('User Prompt: 请生成本轮发言剧本。');

    const response = await callZhizhiApi(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请生成本轮发言剧本。' }
      ],
      {
        temperature: 0.7,
        max_tokens: 4000
      }
    );

    console.log('AI Response:', response);
    console.log('--- AI Werewolf Generation End ---');

    // 尝试提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const script = JSON.parse(jsonMatch[0]) as AIDiscussionScript;
      return script;
    } else {
      throw new Error('无法解析 JSON');
    }
  } catch (error) {
    console.error('AI发言生成失败:', error);
    // 降级：返回空脚本，避免卡死
    return {
      discussions: [
        { speakerId: aiPlayers[0]?.id || 'system', content: '（大家面面相觑，似乎没什么想说的...）' }
      ],
      votes: {}
    };
  }
};
