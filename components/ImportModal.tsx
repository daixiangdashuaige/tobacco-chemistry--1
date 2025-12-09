const handleImport = () => {
    setError(null);
    try {
      // --- STEP 1: Advanced Sanitization (Fixing the Copy-Paste Issue) ---
      let rawInput = jsonText.trim();
      
      // 1. Remove Markdown code blocks (e.g. ```json ... ```)
      // This regex looks for ```json (content) ``` or just ``` (content) ```
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
      const match = rawInput.match(codeBlockRegex);
      if (match && match[1]) {
        rawInput = match[1].trim(); // Extract content inside the code block
      }

      [cite_start]// 2. Remove AI Citation artifacts (e.g.[cite: 12], )
      let cleanJson = rawInput
        .replace(/\[cite_start\]/g, '')
        .replace(/\]+\]/g, '')
        .replace(/\[cite_end\]/g, '');

      // 3. Last resort: Try to find the first '[' and last ']' to isolate the array
      // This helps if there is text before or after the JSON array
      const firstBracket = cleanJson.indexOf('[');
      const lastBracket = cleanJson.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
      }

      // --- STEP 2: Parse JSON ---
      let parsed: any;
      try {
        // Attempt to fix trailing commas (a common JSON error in manual edits)
        // This is a simple regex fix, not perfect but helps with common cases like "}," ]
        const fixedJson = cleanJson.replace(/,\s*([\]}])/g, '$1'); 
        parsed = JSON.parse(fixedJson);
      } catch (e) {
         // Re-throw with a more helpful error message
         throw new Error("无法解析 JSON。请检查：1. 是否完整复制了 [...] 数组？ 2. 结尾是否有无法识别的字符？");
      }

      // --- STEP 3: Normalize Structure (Same as before) ---
      let list = parsed;
      if (!Array.isArray(parsed)) {
        if (parsed.questions && Array.isArray(parsed.questions)) list = parsed.questions;
        else if (parsed.data && Array.isArray(parsed.data)) list = parsed.data;
        else if (parsed.list && Array.isArray(parsed.list)) list = parsed.list;
        else throw new Error("JSON 结构错误：未找到题目数组 (期望格式为 [...] )。");
      }

      // --- STEP 4: Validate & Normalize Fields ---
      const normalizedQuestions: Question[] = list.map((item: any, index: number) => {
        const qText = item.question || item.Question || item.title || item.Title || item.q;
        const opts = item.options || item.Options || item.choices || item.answers;
        let ans = item.answer;
        
        // Normalize answer field variants
        if (item.Answer !== undefined) ans = item.Answer;
        if (item.correct !== undefined) ans = item.correct;
        if (item.correctAnswer !== undefined) ans = item.correctAnswer; // Common variant
        
        const exp = item.explanation || item.Explanation || item.analysis || item.desc || "暂无解析";

        // Validation
        if (!qText) throw new Error(`第 ${index + 1} 题数据缺失：找不到题目内容 (question)`);
        if (!opts || !Array.isArray(opts)) throw new Error(`第 ${index + 1} 题数据错误：选项 (options) 必须是数组`);

        // Answer Conversion (String "A"/"0" -> Index Number)
        if (typeof ans === 'string') {
          const upper = ans.trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E', 'F'].includes(upper)) {
            ans = upper.charCodeAt(0) - 65;
          } else {
            // Try to parse "0", "1" strings
            const num = parseInt(ans);
            if (!isNaN(num)) {
                ans = num;
            } else {
                // Try to match option text content
                const foundIdx = opts.findIndex((o: string) => o.trim() === item.answer.trim());
                ans = foundIdx !== -1 ? foundIdx : 0;
            }
          }
        }
        
        // Final fallback for invalid answer indices
        if (typeof ans !== 'number' || isNaN(ans) || ans < 0 || ans >= opts.length) {
          console.warn(`Question "${qText}" has invalid answer index ${ans}. Defaulting to 0 (Option A).`);
          ans = 0; 
        }

        // ID Generation
        let finalId = item.id;
        if (finalId === undefined || finalId === null || finalId === '') {
          finalId = `imported_${Date.now()}_${index}`;
        }

        return {
          id: finalId,
          question: qText,
          options: opts,
          answer: ans,
          explanation: exp
        };
      });

      if (normalizedQuestions.length === 0) {
        throw new Error("未找到有效题目，请检查 JSON 内容是否为空。");
      }

      onImport(normalizedQuestions, mode);
      onClose();
      setJsonText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "导入过程中发生未知错误，请检查控制台详情。");
    }
  };
