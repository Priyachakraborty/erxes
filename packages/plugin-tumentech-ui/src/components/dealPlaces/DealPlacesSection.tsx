import Box from '@erxes/ui/src/components/Box';
import EmptyState from '@erxes/ui/src/components/EmptyState';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import React from 'react';
import { IButtonMutateProps } from '@erxes/ui/src/types';
import DealPlaceForm from '../../containers/dealPlaces/Form';
import { IDealPlace } from '../../types';
import { MapContainer } from '@erxes/ui/src/styles/main';
import Map from '@erxes/ui/src/components/map/Map';
import { __ } from '@erxes/ui/src/utils/core';
import Icon from '@erxes/ui/src/components/Icon';

export type Props = {
  actionSection?: any;
  title?: string;
  dealId: string;
  dealPlace?: IDealPlace;
  placesChanged: () => void;
  renderButton: (props: IButtonMutateProps) => JSX.Element;
};

export default function Component({
  actionSection,
  dealPlace,
  title = '',
  dealId,
  placesChanged,
  renderButton
}: Props) {
  const renderActionSection = customer => {
    if (!actionSection) {
      return;
    }

    const ActionSection = actionSection;
    return <ActionSection customer={customer} isSmall={true} />;
  };

  const renderBody = (dealPlace?: IDealPlace) => {
    if (!dealPlace || (!dealPlace.startPlaceId && !dealPlace.endPlaceId)) {
      return <EmptyState icon="location-point" text="No data" />;
    }

    const w: any = window;

    if (typeof w.google === 'object' && typeof w.google.maps === 'object') {
      console.log('ALREADY LOADED');
    }

    console.log('IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIi ', w);
    // console.log(w["google"] !== undefined);

    const { startPlace, endPlace } = dealPlace;
    // return (<></>)
    return (
      <div style={{ width: '100%', backgroundColor: 'black' }}>
        {startPlace && startPlace._id && endPlace && endPlace._id && (
          <Map
            id={Math.random().toString(10)}
            center={startPlace.center}
            googleMapApiKey={localStorage.getItem('GOOGLE_MAP_API_KEY') || ''}
            zoom={7}
            locationOptions={[startPlace.center, endPlace.center]}
            streetViewControl={false}
            connectWithLines={true}
          />
        )}
      </div>
    );
  };

  const managePlaces = props => (
    <DealPlaceForm
      dealId={dealId}
      dealPlace={dealPlace}
      closeModal={props.closeModal}
    />
  );

  const extraButtons = (
    <>
      <ModalTrigger
        title="General location information"
        size="lg"
        trigger={
          <button>
            <Icon icon={dealPlace ? 'edit-3' : 'plus-circle'} />
          </button>
        }
        content={managePlaces}
      />
    </>
  );

  return (
    <Box
      title={__(`${title || 'General location information'}`)}
      extraButtons={extraButtons}
      isOpen={true}
      name="showLocation"
    >
      {renderBody(dealPlace)}
    </Box>
  );
}
