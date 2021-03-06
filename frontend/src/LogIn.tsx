import React, { FC, useEffect } from 'react';
import Store from './Interfaces/Store';
import { inject, observer } from 'mobx-react';
import { Container, Header, Image, } from 'semantic-ui-react';
import { whoamiAPICall } from './HelperFunctions';


interface OwnProps {
    store?: Store
}

type Props = OwnProps;

const Logins: FC<Props> = ({ store }: Props) => {








    useEffect(() => {

        whoamiAPICall()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    const generateOutput = () => {

        return (<Container style={{ padding: 50 }}>



            <Header as='h1'>Welcome to BloodVis</Header>
            <Image size="small"
                as='a'
                target="_blank"
                src="https://raw.githubusercontent.com/visdesignlab/visdesignlab.github.io/master/assets/images/logos/vdl.png"
                href="https://vdl.sci.utah.edu"
            />
            <Header as='h3'>Log in</Header>
        </Container>)

    }

    return (

        generateOutput()

    );
}



export default inject('store')(observer(Logins));
