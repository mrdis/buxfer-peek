import * as React from 'react';
import {useLocalStorage,useMap} from 'react-use'
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import * as dateMath from 'date-arithmetic'


function StackedBar({widths,colors,height,borderRadius}){
    if(!borderRadius)borderRadius = 10;
    if(!height)height="20px";
    return <div style={{height:height, display:"flex",borderRadius:borderRadius+"px",overflow:"hidden"}}>
        {widths.map((w,i)=>(
            <div key={i} style={{height:height,width:w,backgroundColor:colors[i],display:"flex",borderLeft:"1px solid "+colors[i]}}></div>
        ))}
    </div>
}


function getPeriodDuration(period){
    if(period=="day")return 1
    if(period=="week")return 7
    if(period=="month")return 30
    if(period=="year")return 365
}
function findPeriodBegin(begin,unit,size,now){
    var periodEnd = begin
    while(now>periodEnd){
        begin = periodEnd
        periodEnd = dateMath.add(periodEnd,size,unit)
    }
    return begin
}
function getBudgetInfo(budget){
    var spent = budget.spent
    var available = budget.balance
    if(available<0)available=0
    var total = spent + available
    var limit = budget.limit
    var duration = budget.periodSize * getPeriodDuration(budget.periodUnit)
    console.log(duration)
    var spentExpected
    if(budget.periodUnit){
        var periodBegin = findPeriodBegin(Date.parse(budget.startDate),budget.periodUnit,budget.periodSize,Date.now())
        console.log(periodBegin)
        var elapsed = (Date.now() - periodBegin)/(24*3600*1000)
        console.log(elapsed)
        
        spentExpected = Math.floor(total / duration * elapsed)
    }
    return {
        spent,
        available,
        spentExpected,
        limit,
        total
    }
}



function BudgetBar({budget}){
    if(!budget.info)return null;
    if(!budget.info.total)return null;
    var {spent,available,spentExpected,limit,total}=budget.info
    var vals=[],colors=[]
    const perc = (val)=>''+(val/Math.max(total,spent)*100)+'%'
    if(spent<=spentExpected){
        // | spent  green | expected-spent dark green | total-expected pale green|
        vals = [perc(spent),perc(spentExpected-spent),'0px',perc(total-spentExpected)]
        colors = ["lightgreen","palegreen","grey","palegreen"]
    }else if(spent<=total){
        // | expected green | spent-expected yellow | total-spent pale green |
        vals = [perc(spentExpected),perc(spent-spentExpected),perc(total-spent)]
        colors = ["limegreen","orange","palegreen"]
    }else{
        // | expected green | total-expected yellow | spent-total red | 
        vals = [perc(spentExpected),perc(total-spentExpected),perc(spent-total)]
        colors = ["limegreen","orange","red"]
    }
    return <div style={{position:"relative",textAlign:"center"}}>
        <div style={{position:"absolute",zIndex:-1,width:"100%",height:"100%"}}>
            <StackedBar 
                widths={vals}
                colors={colors}
                height="100%"
            />    
        </div>
        <div style={{paddingLeft:'10px',paddingRight:'10px'}}>{budgetFormat(spent)}/{budgetFormat(total)}</div>
    </div>
}


const budgetFormat = (value) => Math.floor(value)

export default function View({ authToken }) {
    const [freshData,setFreshData] = React.useState(false)
    const [savedBudgets, setSavedBudgets] = useLocalStorage("budgets", [])
    const [budgets, setBudgets] = React.useState(savedBudgets);

    const [savedFavs, setSavedFavs] = useLocalStorage("favs", {})
    const [favs, {set : setFav, setAllFavs, remove : removeFav, resetFavs}] = useMap(savedFavs)
    React.useEffect(
      () => {
        setSavedFavs(favs)
      },
      // This is important
      [favs]
    );

    const [showHidden,setShowHidden] = React.useState(false)
    const [savedHidden, setSavedHidden] = useLocalStorage("hidden", {})
    const [hidden, {set : setHidden, setAllHidden, remove : removeHidden, resetHidden}] = useMap(savedHidden)
    React.useEffect(
      () => {
        setSavedHidden(hidden)
      },
      // This is important
      [hidden]
    );

    React.useEffect(() => {
        fetch("https://www.buxfer.com/api/budgets?token=" + authToken)
            .then(res => res.json())
            .then(
                (result) => {
                    result.response.budgets = result.response.budgets.map(b=>({...b,info:getBudgetInfo(b)}))
                    //for(var i=0;i<result.response.budgets.length;i++)result.response.budgets[i].info=getBudgetInfo(result.response.budgets[i])
                    setBudgets(result.response.budgets)
                    setSavedBudgets(budgets)
                    setFreshData(true)
                    console.log(result)
                    //for(var b of budgets)console.log(getBudgetInfo(b))
                },
                (error) => {
                    console.log(error)
                }
            )
    }, [])

    return (
        <React.Fragment>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Budgets
            </Typography>
            {freshData ? "" : "Showing cached data, loading fresh data..."}
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Available</TableCell>
                        <TableCell>Spent</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {budgets.map((budget) => (budget.balance!==undefined) && (favs[budget.id])?(
                        <TableRow key={budget.budgetId}>
                            <TableCell>
                                <IconButton 
                                    color="primary"
                                    onClick={()=>removeFav(budget.budgetId,1)}
                                >
                                    <StarIcon/>
                                </IconButton>
                            </TableCell> 
                            <TableCell>{budget.name}</TableCell>
                            <TableCell align="right">{`${budgetFormat(budget.balance)}`}</TableCell>
                            <TableCell><BudgetBar budget={budget}/></TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    ):null)}
                    {budgets.map((budget) => (budget.balance!==undefined) && !hidden[budget.id] && !favs[budget.id]?(
                        <TableRow key={budget.budgetId}>
                            <TableCell>
                                <IconButton 
                                    onClick={()=>setFav(budget.budgetId,1)}
                                >
                                    <StarOutlineIcon/>
                                </IconButton>
                            </TableCell>
                            <TableCell>{budget.name}</TableCell>
                            <TableCell align="right">{`${budgetFormat(budget.balance)}`}</TableCell>
                            <TableCell><BudgetBar budget={budget}/></TableCell>
                            <TableCell>
                                <IconButton 
                                    onClick={()=>setHidden(budget.budgetId,1)}
                                >
                                    <VisibilityOffIcon/>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ):null)}
                    <TableRow>
                        <TableCell colSpan={4}>
                        <Button 
                            onClick={()=>setShowHidden(!showHidden)}
                        >
                            Show hidden budgets
                        </Button>
                        </TableCell>
                    </TableRow>
                    {budgets.map((budget) => showHidden && (budget.balance!==undefined) && hidden[budget.id]?(
                        <TableRow key={budget.budgetId}>
                            <TableCell></TableCell>
                            <TableCell>{budget.name}</TableCell>
                            <TableCell align="right">{`${budgetFormat(budget.balance)}`}</TableCell>
                            <TableCell><BudgetBar budget={budget}/></TableCell>
                            <TableCell>
                                <IconButton 
                                    onClick={()=>removeHidden(budget.budgetId,1)}
                                >
                                    <VisibilityIcon/>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ):null)}
                </TableBody>
            </Table>
        </React.Fragment>
    );
}