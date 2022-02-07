import './App.css';

import {useLocalStorage} from 'react-use'
import Paper from '@mui/material/Paper';

import Login from './components/Login';
import View from './components/View';


function Content() {
  const [authToken, setAuthToken] = useLocalStorage("authToken", "");

  if(authToken == ""){
    return <Login
      onSucccess={(token)=>{
        setAuthToken(token)
      }}
      onFail={(status)=>{
        console.log(status)
      }}
    />;
  }else{
    return <View authToken={authToken}/>;
  }
}

function App(){
  return <Content/>
}

export default App;
