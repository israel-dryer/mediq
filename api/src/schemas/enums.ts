import {
    actorKind,
    appointmentOrigin,
    appointmentStatus,
    asapState, claimKind,
    messageChannel,
    messageKind,
    offerState
} from '../db/enums.js'
import Type from "typebox";


export const AppointmentStatus = Type.Enum(appointmentStatus.enumValues);
export const AppointmentOrigin = Type.Enum(appointmentOrigin.enumValues);
export const AsapState = Type.Enum(asapState.enumValues);
export const OfferState = Type.Enum(offerState.enumValues);
export const ActorKind = Type.Enum(actorKind.enumValues);
export const MessageKind = Type.Enum(messageKind.enumValues);
export const MessageChannel = Type.Enum(messageChannel.enumValues);
export const ClaimKind = Type.Enum(['time_off', 'admin']);
export const EventKind = Type.Enum(['created', 'status', 'moved']);
export const Action = Type.Enum(
    ['confirm', 'cancel', 'check_in', 'join_asap', 'arrive', 'room', 'complete', 'no_show',
        'bump', 'move', 'rebook']);
