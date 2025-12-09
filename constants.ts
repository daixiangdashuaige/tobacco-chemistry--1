import { Question } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "驾驶机动车在高速公路上发生故障时，以下做法正确的是什么？",
    options: [
      "开启危险报警闪光灯，在车后150米外设置警告标志",
      "坐在车内等待救援",
      "拦截过往车辆求救",
      "在应急车道内进行紧急修理"
    ],
    answer: 0,
    explanation: "在高速公路上发生故障，应立即开启危险报警闪光灯，将车移至不妨碍交通的地方停放；难以移动的，应当持续开启危险报警闪光灯，并在来车方向150米以外设置警告标志，车上人员应当迅速转移到右侧路肩上或者应急车道内，并且迅速报警。"
  },
  {
    id: 2,
    question: "React 中用于处理副作用的 Hook 是？",
    options: [
      "useState",
      "useEffect",
      "useContext",
      "useReducer"
    ],
    answer: 1,
    explanation: "useEffect Hook 视作 componentDidMount、componentDidUpdate 和 componentWillUnmount 的组合，用于处理副作用。"
  },
  {
    id: 3,
    question: "下列哪种HTTP状态码表示“未授权”？",
    options: [
      "200",
      "404",
      "401",
      "500"
    ],
    answer: 2,
    explanation: "401 Unauthorized 代表请求要求用户的身份认证。"
  }
];