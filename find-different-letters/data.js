// 한글 문자 레벨
const koreanCharsLevels = [
  "가나다라마바사아자차카타파하",
  "가갸거겨고교구규그기",
  "나냐너녀노뇨누뉴느니",
  "다댜더뎌도됴두듀드디",
  "라랴러려로료루류르리",
  "마먀머며모묘무뮤므미",
  "바뱌버벼보뵤부뷰브비",
  "사샤서셔소쇼수슈스시",
  "아야어여오요우유으이",
  "자쟈저져조죠주쥬즈지",
  "차챠처쳐초쵸추츄츠치",
  "카캬커켜코쿄쿠큐크키",
  "타탸터텨토툐투튜트티",
  "파퍄퍼펴포표푸퓨프피",
  "하햐허혀호효후휴흐히",
  "각갹걱격간갼건견갇갿걷겯",
  "곡굑궉궥귁귝긓깆꺅꺾껵꼈",
  "낙냑넉녁난냔넌년낟냫넛녇",
  "닥댝덕뎍단딴던뎐닫닿덛뎯",
  "락략럭력란랸런려랃랗럳렇",
  "막먁먹멱만먄먼며맏맣멋멷",
  "박뱍벅벽반반번변받밧벋볃",
  "삭샥석셕산산선션삳샇섯셓",
  "악약억역안얀언연앋앛억엏",
  "작쟉적젹잔잰전젼잗잫젓졋",
  "착챡척척찬챤천쳔찧챃첟쳗",
  "칵캭컥켝칸캰컨켠칻캫컷켷",
  "탁탹턱텩탄탼턴텬탇탿턷텯",
  "팍퍅퍽펵판퍈펀편팋팧펋폇",
  "학핵헉혁한핸헌현핟핳헏혛",
  "갈걀걸겔갑갭겁겝갓갷걋겟",
  "골굘굴귤굽굡굿귿궇궷귿긓",
  "놀뇰눌뉼눕뉍눗뉻뇨뉴늬니",
  "돌됼둘듈둡듑둣듯됴듀디디",
  "롤뢸룰률룹뤁룻륻료류리리",
  "몰뫄물뮬뭅뮉뭇뮷묘뮤미미",
  "볼뵬불뷸붑뷥붓븃뵤뷰비비",
  "솔쇌술슐숩슙숫슷쇼슈시시",
  "올욀울율웁윕웃윗요유이이",
  "졸줄줄쥴줍쥽줏쥿죠쥬지지",
  "촐쵤출츌춥츕춧츻쵸츄치치",
  "콜쿨쿨큘쿱킁쿳킷쿄큐키키",
  "톨퇄툴튤툽튑툿튯툐튜티티",
  "폴퐐풀퓰풉퓹풋퓻표퓨피피",
  "홀훨훌휼훕휩훗휫효휴히히",
  "갊갌갎갏갑갓갔강갖갗같갚",
  "깊깋깍깎깐깔깖깜깝깟깠깡",
  "낢낣낥낦낧남낪낫났낭낮낯",
  "닦닧닩닫닭닮닯닳담답닷닸",
  "맑맒맔맕맘맙맛망맞맡맣매",
  "밝밞밟밤밥밧방밭배백밴밸",
  "샅샆샇샌샐샘샙샛샜생샤샥",
  "앎앏앐앒앓암압앗았앙앝앞",
  "잦잧잨잩잫작잭잰잴잼잽잿",
  "찮찯찰찹찻찼창찾채책챈챌",
  "칮칯칰칱칳칸칼캄캅캇캉캐",
  "탮탯탰탱탲탴탶탸탹탺탻탼",
  "팢팣팤팥팦팧팩팬팰팸팹팻",
  "핮핯핰핱핳학한할함합핫항",
  "흙흚흛흝흞흟흠흡흣흤흥흩",
];

export { koreanCharsLevels };
